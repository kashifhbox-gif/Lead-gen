import fs from 'fs';
import path from 'path';
import { SettingsService } from "@/app/services/SettingsService";
import { AiService } from "@/app/services/AiService";
import { LeadService } from "@/app/services/LeadService";

export async function processLeadEvaluation(
  lead: any,
  logger: any
): Promise<boolean> {
  try {
    logger.info({ leadId: lead._id }, "Fetching admin settings for Gemini AI evaluation");
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
      logger.error("Gemini API Key is not configured in Settings or .env");
      throw new Error("Gemini API Key is not configured. Please add it in Settings.");
    }

    const modelName = adminConfig?.geminiModel || 'gemini-3.1-flash-lite';
    const basePrompt = adminConfig?.aiPrompt || '';

    const aiService = new AiService(geminiKey, modelName, basePrompt);

    logger.info({ leadId: lead._id, modelName }, "Sending lead to AI for evaluation");
    const aiResult = await aiService.evaluateLead(lead.postContent, lead.searchQuery);
    
    const score = aiResult.score || 0;
    const isQualified = score >= 7;

    logger.info({ leadId: lead._id, score, isQualified }, "Received AI evaluation result");

    const updateData: any = {
      score: score,
      aiReasoning: aiResult.reasoning || "No reasoning provided.",
      outreachHook: aiResult.outreachHook || "",
      isQualified
    };

    if (aiResult.extractedEmail) {
      logger.info({ leadId: lead._id, extractedEmail: aiResult.extractedEmail }, "AI found an email address in the content");
      updateData.firstPersonalEmail = aiResult.extractedEmail;
      updateData.allEmails = [aiResult.extractedEmail];
    }

    await LeadService.updateLead(lead._id, updateData);
    logger.info({ leadId: lead._id }, "Successfully updated lead with AI evaluation");

    return isQualified;
  } catch (error: any) {
    logger.error({ err: error.message, leadId: lead._id }, "Failed to evaluate lead");
    return false;
  }
}
