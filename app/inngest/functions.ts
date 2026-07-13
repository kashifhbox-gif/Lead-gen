import { inngest } from "@/app/lib/inngest";
import connectToDatabase from "@/app/lib/db";
import Job from "@/app/models/Job";
import Lead from "@/app/models/Lead";
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';

export const evaluateLeads = inngest.createFunction(
  { id: "evaluate-leads-job", triggers: [{ event: "app/evaluate.leads" }] },
  async ({ event, step }) => {
    const { jobId } = event.data;

    // 1. Fetch un-evaluated leads for this job
    const leadsToEvaluate = await step.run("fetch-leads", async () => {
      await connectToDatabase();

      const job = await Job.findById(jobId);
      if (!job) throw new Error("Job not found");

      job.status = 'EVALUATING';
      await job.save();

      const leads = await Lead.find({ jobId, isQualified: false, score: { $exists: false } }).lean();

      return JSON.parse(JSON.stringify(leads));
    });

    if (!leadsToEvaluate || leadsToEvaluate.length === 0) {
      return { message: "No leads to evaluate" };
    }

    // 2. Evaluate each lead one by one to avoid timeouts (Step Functions magic!)
    for (const lead of leadsToEvaluate) {
      await step.run(`evaluate-lead-${lead._id}`, async () => {
        await connectToDatabase();

        try {
          // Fetch the custom AI prompt and API key from the admin user
          const User = require('@/app/models/User').default;
          const adminUser = await User.findOne();

          let geminiKey = adminUser?.geminiApiKey || process.env.GEMINI_API_KEY;
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

          const ai = new GoogleGenAI({ apiKey: geminiKey });

          const basePrompt = adminUser?.aiPrompt || `
            You are an expert B2B Lead Generation AI for a Software House.
            Analyze the following LinkedIn post and determine if the author is a potential lead for app development, web development, or custom software services.

            Score them from 0 to 10 based on these rules:
            - 9-10: User explicitly states they are looking to hire an agency, need an app/website built, or are seeking a tech partner.
            - 7-8: User is asking for recommendations for developers or discussing a new digital project they want to launch.
            - 4-6: User is discussing general tech topics but not explicitly hiring.
            - 0: User is promoting their own software services (a competitor), selling courses, or discussing unrelated topics.

            Provide a short 1-2 sentence reasoning for your score.
          `;

          const prompt = `
            ${basePrompt}
            
            IMPORTANT: Format your response strictly as JSON with this exact structure:
            { "score": number, "reasoning": "string", "outreachHook": "string" }
            
            The 'outreachHook' should be a short, personalized, and catchy opening line (1-2 sentences) you would send to this person in a DM to start a conversation, based specifically on the content of their post.
            
            Post Content:
            "${lead.postContent}"
          `;

          const modelName = adminUser?.geminiModel || 'gemini-3.1-flash-lite';

          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });

          let resultText = response.text || "";
          resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();

          let aiResult = { score: 0, reasoning: "Failed to parse", outreachHook: "" };
          try {
            aiResult = JSON.parse(resultText);
          } catch (e) {
            console.error("Gemini JSON parse error:", e);
          }

          const score = aiResult.score || 0;

          await Lead.findByIdAndUpdate(lead._id, {
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
      await connectToDatabase();
      await Job.findByIdAndUpdate(jobId, { status: 'COMPLETED' });
    });

    return { message: "Evaluated successfully", processed: leadsToEvaluate.length };
  }
);
