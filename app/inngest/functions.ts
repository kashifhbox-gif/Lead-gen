import { inngest } from "@/app/lib/inngest";
import { CampaignService } from "@/app/services/CampaignService";
import { LeadService } from "@/app/services/LeadService";
import { SettingsService } from "@/app/services/SettingsService";
import { AiService } from "@/app/services/AiService";
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
        try {
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

        } catch (error) {
          console.error(`Failed to evaluate lead ${lead._id}:`, error);
        }
      });
    }

    // 3. Complete the Job
    await step.run("complete-job", async () => {
      await CampaignService.updateCampaign(jobId, { status: 'COMPLETED' });
    });

    return { message: "Evaluated successfully", processed: leadsToEvaluate.length };
  }
);
