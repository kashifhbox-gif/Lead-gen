import { inngest } from "@/app/lib/inngest";
import connectToDatabase from "@/app/lib/db";
import Job from "@/app/models/Job";
import Lead from "@/app/models/Lead";
import { GoogleGenerativeAI } from "@google/genai";

const ai = new GoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

export const evaluateLeads = inngest.createFunction(
  { id: "evaluate-leads-job" },
  { event: "app/evaluate.leads" },
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
          const prompt = `
            You are an expert B2B Lead Generation AI.
            Analyze the following LinkedIn post. Determine if the author is a potential lead.
            Score them from 0 to 10, where 10 means they are highly likely to buy B2B SaaS tools or are hiring.
            Provide a short 1-2 sentence reasoning.
            
            Format your response strictly as JSON:
            { "score": number, "reasoning": "string" }
            
            Post Content:
            "${lead.postContent}"
          `;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });

          let resultText = response.text || "";
          resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
          
          let aiResult = { score: 0, reasoning: "Failed to parse" };
          try {
            aiResult = JSON.parse(resultText);
          } catch (e) {
            console.error("Gemini JSON parse error:", e);
          }

          const score = aiResult.score || 0;
          
          await Lead.findByIdAndUpdate(lead._id, {
            score: score,
            aiReasoning: aiResult.reasoning || "No reasoning provided.",
            isQualified: score >= 7
          });

        } catch (error) {
          console.error(\`Failed to evaluate lead \${lead._id}:\`, error);
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
