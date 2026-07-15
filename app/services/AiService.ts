import { GoogleGenAI } from "@google/genai";

export class AiService {
  private ai: GoogleGenAI;
  private modelName: string;
  private basePrompt: string;

  constructor(apiKey: string, modelName: string, basePrompt: string) {
    if (!apiKey) {
      throw new Error("Gemini API Key is not configured. Please add it in Settings.");
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = modelName || 'gemini-3.1-flash-lite';
    this.basePrompt = basePrompt || `
      You are an expert B2B Lead Generation AI for a Software House.
      Analyze the following LinkedIn post and determine if the author is a potential lead for app development, web development, or custom software services.

      Score them from 0 to 10 based on these rules:
      - 9-10: User explicitly states they are looking to hire an agency, need an app/website built, or are seeking a tech partner.
      - 7-8: User is asking for recommendations for developers or discussing a new digital project they want to launch.
      - 4-6: User is discussing general tech topics but not explicitly hiring.
      - 0: User is promoting their own software services (a competitor), selling courses, or discussing unrelated topics.

      Provide a short 1-2 sentence reasoning for your score. 
      IMPORTANT: If the user provides an email address or phone number in the post, make sure to HIGHLIGHT IT in the reasoning so we don't have to spend credits fetching it.
    `;
  }

  /**
   * Evaluates a lead's post content using Gemini
   */
  async evaluateLead(postContent: string) {
    const prompt = `
      ${this.basePrompt}
      
      IMPORTANT: Format your response strictly as JSON with this exact structure:
      { "score": number, "reasoning": "string", "outreachHook": "string" }
      
      The 'outreachHook' should be a short, personalized, and catchy opening line (1-2 sentences) you would send to this person in a DM to start a conversation, based specifically on the content of their post.
      
      Post Content:
      "${postContent}"
    `;

    const response = await this.ai.models.generateContent({
      model: this.modelName,
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

    return aiResult;
  }
}
