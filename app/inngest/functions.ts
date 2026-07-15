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
    for (const lead of leadsToEvaluate) {
      await step.run(`evaluate-lead-${lead._id}`, async () => {
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

          const aiResult = await aiService.evaluateLead(lead.postContent);
          const score = aiResult.score || 0;

          await LeadService.updateLead(lead._id, {
            score: score,
            aiReasoning: aiResult.reasoning || "No reasoning provided.",
            outreachHook: aiResult.outreachHook || "",
            isQualified: score >= 7
          });
      });
      // Sleep for 2 seconds to avoid hitting Gemini rate limits
      await step.sleep(`sleep-${lead._id}`, "2s");
    }

    // 3. Complete the Job
    await step.run("complete-job", async () => {
      await CampaignService.updateCampaign(jobId, { status: 'COMPLETED' });
    });

    return { message: "Evaluated successfully", processed: leadsToEvaluate.length };
  }
);

export const enrichCampaignLeads = inngest.createFunction(
  { id: "enrich-leads-job", triggers: [{ event: "app/enrich.leads" }] },
  async ({ event, step }) => {
    const { jobId } = event.data;

    // 1. Fetch qualified leads without emails
    const leadsToEnrich = await step.run("fetch-leads-for-enrichment", async () => {
      await CampaignService.updateCampaign(jobId, { emailEnrichmentStatus: 'RUNNING' });
      const leads = await LeadService.getLeadsByJobId(jobId);
      return JSON.parse(JSON.stringify(leads.filter((l: any) => l.isQualified && l.profileUrl && !l.firstPersonalEmail)));
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

    // 3. Process each lead
    for (const lead of leadsToEnrich) {
      await step.run(`enrich-lead-${lead._id}`, async () => {
        try {
          // Attempt to extract a name if none is explicitly provided, based on postContent pattern
          let name = lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : undefined;
          if (!name && lead.postContent) {
            const authorMatch = lead.postContent.match(/Author:\s*([^(\n]+)/i);
            if (authorMatch && authorMatch[1]) {
              name = authorMatch[1].trim();
            }
          }

          const apolloData = await apolloService.enrichLead(lead.profileUrl, name);
          
          if (apolloData && apolloData.person) {
            const person = apolloData.person;
            const emails = [];
            if (person.email) emails.push(person.email);
            if (person.personal_emails && person.personal_emails.length > 0) {
              emails.push(...person.personal_emails);
            }

            const phoneNumbers = person.phone_numbers ? person.phone_numbers.map((p: any) => p.sanitized_number) : [];

            await LeadService.updateLead(lead._id, {
              firstPersonalEmail: emails[0] || undefined,
              allEmails: Array.from(new Set(emails)),
              firstName: person.first_name || lead.firstName,
              lastName: person.last_name || lead.lastName,
              phones: phoneNumbers,
              apolloEnrichmentAttempted: true
            });
          } else {
            await LeadService.updateLead(lead._id, {
              apolloEnrichmentAttempted: true
            });
          }
        } catch (error: any) {
          console.error(`Failed to enrich lead ${lead._id}:`, error.message);
          // We swallow the error so it doesn't fail the whole batch, just this lead
        }
      });
      // Sleep slightly to respect rate limits (Apollo basic plan has good limits, but safe is better)
      await step.sleep(`sleep-apollo-${lead._id}`, "1s");
    }

    // 4. Complete the job
    await step.run("complete-enrichment", async () => {
      await CampaignService.updateCampaign(jobId, { emailEnrichmentStatus: 'COMPLETED' });
    });

    return { message: "Enrichment completed", processed: leadsToEnrich.length };
  }
);
