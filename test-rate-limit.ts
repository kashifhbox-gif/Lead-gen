import { AiService } from './app/services/AiService';
import fs from 'fs';
import path from 'path';

async function test() {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  const match = envFile.match(/GEMINI_API_KEY=([^\n\r]+)/);
  const apiKey = match ? match[1].trim() : '';
  
  const service = new AiService(apiKey, 'gemini-3.1-flash-lite', '');
  
  console.log("Making multiple requests to test rate limit...");
  for (let i = 0; i < 5; i++) {
    try {
      console.log(`Request ${i + 1}...`);
      const result = await service.evaluateLead("I need a web developer");
      console.log("Success");
    } catch (e: any) {
      console.error("ERROR at request", i + 1, ":", e.message);
    }
  }
}
test();
