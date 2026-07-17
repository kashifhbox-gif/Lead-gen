import { inngest } from "@/app/lib/inngest";
import { CampaignService } from "@/app/services/CampaignService";
import { LeadService } from "@/app/services/LeadService";
import { SettingsService } from "@/app/services/SettingsService";
import { AiService } from "@/app/services/AiService";
import { ApolloService } from "@/app/services/ApolloService";
import fs from 'fs';
import path from 'path';

export const evaluateLeads = inngest.createFunction(
  { id: "evaluate-leads-job", triggers: [{ event: "app/evaluate.leads" }] },
  async ({ event, step }) => {
    const { jobId } = event.data;

    // 1. Fetch un-evaluated leads for this job
    const leadsToEvaluate = await step.run("fetch-leads", async () => {
      await CampaignService.updateCampaign(jobId, { status: 'EVALUATING' });
      const leads = await LeadService.getUnevaluatedLeads(jobId);
      return JSON.parse(JSON.stringify(leads));
    });

    if (!leadsToEvaluate || leadsToEvaluate.length === 0) {
      return { message: "No leads to evaluate" };
    }

    // 2. Evaluate each lead one by one to avoid timeouts (Step Functions magic!)
    let qualifiedCount = 0;
    for (const lead of leadsToEvaluate) {
      const isQualified = await step.run(`evaluate-lead-${lead._id}`, async () => {
          // Fetch the custom AI prompt and API key from the admin user
          const adminConfig = await SettingsService.getAdminConfig();

          let geminiKey = adminConfig?.geminiApiKey || process.env.GEMINI_API_KEY;
          if (!geminiKey) {
            try {
              const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
              const match = envFile.match(/GEMINI_API_KEY=([^\n\r]+)/);
              if (match) geminiKey = match[1].trim();
            } catch (e) { }
          }

          if (!geminiKey) {
            throw new Error("Gemini API Key is not configured. Please add it in Settings.");
          }

          const modelName = adminConfig?.geminiModel || 'gemini-3.1-flash-lite';
          const basePrompt = adminConfig?.aiPrompt || '';

          const aiService = new AiService(geminiKey, modelName, basePrompt);

          const aiResult = await aiService.evaluateLead(lead.postContent, lead.searchQuery);
          const score = aiResult.score || 0;

          const updateData: any = {
            score: score,
            aiReasoning: aiResult.reasoning || "No reasoning provided.",
            outreachHook: aiResult.outreachHook || "",
            isQualified: score >= 7
          };

          if (aiResult.extractedEmail) {
            updateData.firstPersonalEmail = aiResult.extractedEmail;
            updateData.allEmails = [aiResult.extractedEmail];
          }

          await LeadService.updateLead(lead._id, updateData);

          return score >= 7;
      });
      if (isQualified) {
        qualifiedCount++;
      }
      // Sleep for 2 seconds to avoid hitting Gemini rate limits
      await step.sleep(`sleep-${lead._id}`, "2s");
    }

    // 3. Complete the Job
    await step.run("complete-job", async () => {
      await CampaignService.updateCampaign(jobId, { status: 'COMPLETED' });
    });

    // 4. Auto-trigger bulk enrichment if there are qualified leads
    if (qualifiedCount > 0) {
      await step.sendEvent("trigger-bulk-enrichment", {
        name: "app/enrich.leads",
        data: { jobId }
      });
    }

    return { message: "Evaluated successfully", processed: leadsToEvaluate.length, qualified: qualifiedCount };
  }
);

export const enrichCampaignLeads = inngest.createFunction(
  { id: "enrich-leads-job", triggers: [{ event: "app/enrich.leads" }] },
  async ({ event, step }) => {
    const { jobId } = event.data;

    // 1. Fetch qualified leads without emails
    const leadsToEnrich = await step.run("fetch-leads-for-enrichment", async () => {
      const leads = await LeadService.getLeadsByJobId(jobId);
      const filtered = leads.filter((l: any) => l.isQualified && l.profileUrl && !l.firstPersonalEmail);
      await CampaignService.updateCampaign(jobId, { 
        emailEnrichmentStatus: 'RUNNING',
        totalEnrichmentTarget: filtered.length
      });
      return JSON.parse(JSON.stringify(filtered));
    });

    if (!leadsToEnrich || leadsToEnrich.length === 0) {
      return { message: "No leads to enrich" };
    }

    // 2. Fetch API key
    const apolloKey = await step.run("fetch-apollo-key", async () => {
      const adminConfig = await SettingsService.getAdminConfig();
      let key = adminConfig?.apolloApiKey || process.env.APOLLO_API_KEY;
      
      if (!key) {
        try {
          const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
          const match = envFile.match(/APOLLO_API_KEY=([^\n\r]+)/);
          if (match) key = match[1].trim();
        } catch (e) { }
      }
      return key;
    });

    if (!apolloKey) {
      throw new Error("Apollo API Key is not configured. Please add it in Settings.");
    }

    const apolloService = new ApolloService(apolloKey);

    // 3. Set UI Spinners immediately
    await step.run("set-spinners", async () => {
      for (const lead of leadsToEnrich) {
        await LeadService.updateLead(lead._id, {
          apolloEmailEnrichmentRequested: true,
          apolloPhoneEnrichmentRequested: true
        });
      }
    });

    // 4. Process each chunk
    const chunkSize = 10;
    for (let i = 0; i < leadsToEnrich.length; i += chunkSize) {
      const chunk = leadsToEnrich.slice(i, i + chunkSize);
      
      const leadsNeedingTimeout = await step.run(`enrich-chunk-${i}`, async () => {
        try {
          const bulkPayload = chunk.map((lead: any) => {
            let name = lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : undefined;
            if (!name && lead.postContent) {
              const authorMatch = lead.postContent.match(/Author:\s*([^(\n]+)/i);
              if (authorMatch && authorMatch[1]) {
                name = authorMatch[1].trim();
              }
            }
            return {
              linkedinUrl: lead.profileUrl,
              name,
              _id: lead._id
            };
          });

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
          const leadIdsStr = chunk.map((l: any) => l._id.toString()).join(',');
          const webhookUrl = `${baseUrl}/api/webhooks/apollo?leadIds=${leadIdsStr}`;
          const apolloData = await apolloService.bulkEnrichLeads(bulkPayload, webhookUrl);
          
          const needsTimeout: string[] = [];
          
          const matches = apolloData?.matches || apolloData?.contacts || apolloData?.people || [];

          for (const person of matches) {
            const matchedLead = chunk.find((l: any) => l.profileUrl === person.linkedin_url);
            if (matchedLead) {
              const emails = [];
              if (person.email) emails.push(person.email);
              if (person.personal_emails && person.personal_emails.length > 0) {
                emails.push(...person.personal_emails);
              }

              const phoneNumbers = person.phone_numbers ? person.phone_numbers.map((p: any) => p.sanitized_number) : [];

              await LeadService.updateLead(matchedLead._id, {
                firstPersonalEmail: emails[0] || matchedLead.firstPersonalEmail,
                allEmails: Array.from(new Set([...(matchedLead.allEmails || []), ...emails])),
                firstName: person.first_name || matchedLead.firstName,
                lastName: person.last_name || matchedLead.lastName,
                phones: Array.from(new Set([...(matchedLead.phones || []), ...phoneNumbers])),
                apolloEnrichmentAttempted: true,
                apolloPhoneEnrichmentRequested: phoneNumbers.length === 0
              });

              if (phoneNumbers.length === 0) {
                needsTimeout.push(matchedLead._id.toString());
              }
            }
          }

          // Keep spinners active for leads that didn't match immediately, as Apollo will fetch them async
          for (const lead of chunk) {
            const foundInMatches = matches.find((p: any) => p.linkedin_url === lead.profileUrl);
            if (!foundInMatches) {
              await LeadService.updateLead(lead._id, {
                apolloEnrichmentAttempted: true,
                apolloPhoneEnrichmentRequested: true,
                apolloEmailEnrichmentRequested: true
              });
              needsTimeout.push(lead._id.toString());
            }
          }

          return needsTimeout;
        } catch (error: any) {
          console.error(`Failed to bulk enrich chunk ${i}:`, error.message);
          return [];
        }
      });

      // Sleep slightly to respect rate limits
      await step.sleep(`sleep-apollo-chunk-${i}`, "1s");
    }

    // 4. Complete the job
    await step.run("complete-enrichment", async () => {
      await CampaignService.updateCampaign(jobId, { emailEnrichmentStatus: 'COMPLETED' });
    });

    // 5. Trigger a single job-level timeout to clean up any stuck spinners after 15m
    await step.sendEvent("trigger-job-timeout", {
      name: "app/enrich.job.timeout",
      data: { jobId }
    });

    return { message: "Enrichment completed", processed: leadsToEnrich.length };
  }
);

export const timeoutApolloJob = inngest.createFunction(
  { id: "timeout-apollo-job", triggers: [{ event: "app/enrich.job.timeout" }] },
  async ({ event, step }) => {
    const { jobId } = event.data;

    // Wait for 15 minutes for webhooks to arrive
    await step.sleep("wait-for-apollo-webhooks", "15m");

    // Clear stuck spinners for all leads in this job
    await step.run("clear-job-spinners", async () => {
      await LeadService.clearStuckSpinnersForJob(jobId);
    });

    return { message: "Job timeouts cleared" };
  }
);
