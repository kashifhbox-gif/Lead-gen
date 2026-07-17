import { inngest } from "@/app/lib/inngest";
import { CampaignService } from "@/app/services/CampaignService";
import { LeadService } from "@/app/services/LeadService";
import { SettingsService } from "@/app/services/SettingsService";
import { AiService } from "@/app/services/AiService";
import { ApolloService } from "@/app/services/ApolloService";
import fs from 'fs';
import path from 'path';
import { processEnrichmentChunk } from './enrichmentHelpers';
import { processLeadEvaluation } from './evaluationHelpers';

export const evaluateLeads = inngest.createFunction(
  { id: "evaluate-leads-job", triggers: [{ event: "app/evaluate.leads" }] },
  async ({ event, step, logger }) => {
    const { jobId } = event.data;

    logger.info({ jobId }, "Starting evaluateLeads job");

    // 1. Fetch un-evaluated leads for this job
    const leadsToEvaluate = await step.run("fetch-leads", async () => {
      await CampaignService.updateCampaign(jobId, { status: 'EVALUATING' });
      const leads = await LeadService.getUnevaluatedLeads(jobId);
      logger.info({ leadsCount: leads.length }, "Found unevaluated leads");
      return JSON.parse(JSON.stringify(leads));
    });

    if (!leadsToEvaluate || leadsToEvaluate.length === 0) {
      logger.info("No leads to evaluate, completing job");
      return { message: "No leads to evaluate" };
    }

    // 2. Evaluate each lead one by one to avoid timeouts (Step Functions magic!)
    let qualifiedCount = 0;
    for (const lead of leadsToEvaluate) {
      const isQualified = await step.run(`evaluate-lead-${lead._id}`, async () => {
        logger.info({ leadId: lead._id }, "Processing evaluation for lead");
        return await processLeadEvaluation(lead, logger);
      });
      if (isQualified) {
        qualifiedCount++;
      }
      // Sleep for 2 seconds to avoid hitting Gemini rate limits
      await step.sleep(`sleep-${lead._id}`, "2s");
    }

    // 3. Complete the Job
    await step.run("complete-job", async () => {
      logger.info("Marking campaign status as COMPLETED");
      await CampaignService.updateCampaign(jobId, { status: 'COMPLETED' });
    });

    // 4. Auto-trigger bulk enrichment if there are qualified leads
    if (qualifiedCount > 0) {
      logger.info({ qualifiedCount }, "Triggering automatic bulk enrichment for qualified leads");
      await step.sendEvent("trigger-bulk-enrichment", {
        name: "app/enrich.leads",
        data: { jobId }
      });
    } else {
      logger.info("No qualified leads found, skipping automatic enrichment");
    }

    logger.info({ processedCount: leadsToEvaluate.length, qualifiedCount }, "Evaluation job finished successfully");
    return { message: "Evaluated successfully", processed: leadsToEvaluate.length, qualified: qualifiedCount };
  }
);

export const enrichCampaignLeads = inngest.createFunction(
  { id: "enrich-leads-job", triggers: [{ event: "app/enrich.leads" }] },
  async ({ event, step, logger }) => {
    const { jobId } = event.data;
    
    logger.info({ jobId }, "Starting enrichCampaignLeads job");

    // 1. Fetch qualified leads without emails
    const leadsToEnrich = await step.run("fetch-leads-for-enrichment", async () => {
      const leads = await LeadService.getLeadsByJobId(jobId);
      const filtered = leads.filter((l: any) => l.isQualified && l.profileUrl && (!l.firstPersonalEmail || !l.phones || l.phones.length === 0));
      await CampaignService.updateCampaign(jobId, { 
        emailEnrichmentStatus: 'RUNNING',
        totalEnrichmentTarget: filtered.length
      });
      logger.info({ leadsCount: filtered.length }, "Found leads needing enrichment");
      return JSON.parse(JSON.stringify(filtered));
    });

    if (!leadsToEnrich || leadsToEnrich.length === 0) {
      logger.info("No leads to enrich, completing job");
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

    logger.info("Setting initial spinners for leads");
    const apolloService = new ApolloService(apolloKey);

    // 3. Set UI Spinners immediately
    await step.run("set-spinners", async () => {
      for (const lead of leadsToEnrich) {
        await LeadService.updateLead(lead._id, {
          apolloEmailEnrichmentRequested: true,
          apolloPhoneEnrichmentRequested: true,
          apolloEnrichmentRequestedAt: new Date()
        });
      }
    });

    // 4. Process each chunk
    const chunkSize = 10;
    for (let i = 0; i < leadsToEnrich.length; i += chunkSize) {
      const chunk = leadsToEnrich.slice(i, i + chunkSize);
      
      const leadsNeedingTimeout = await step.run(`enrich-chunk-${i}`, async () => {
        logger.info({ chunkIndex: i, chunkSize: chunk.length }, "Processing enrichment chunk");
        return await processEnrichmentChunk(chunk, apolloService, logger);
      });

      // Sleep slightly to respect rate limits
      await step.sleep(`sleep-apollo-chunk-${i}`, "1s");
    }

    // 4. Complete the job
    await step.run("complete-enrichment", async () => {
      logger.info("Marking campaign enrichment status as COMPLETED");
      await CampaignService.updateCampaign(jobId, { emailEnrichmentStatus: 'COMPLETED' });
    });

    logger.info({ processedCount: leadsToEnrich.length }, "Enrichment job finished successfully");
    return { message: "Enrichment completed", processed: leadsToEnrich.length };
  }
);
