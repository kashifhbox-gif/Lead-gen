import { AiService } from './app/services/AiService';
import fs from 'fs';
import path from 'path';

async function test() {
  try {
    const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
    const match = envFile.match(/GEMINI_API_KEY=([^\n\r]+)/);
    const apiKey = match ? match[1].trim() : '';
    
    console.log('API Key length:', apiKey.length);
    
    const service = new AiService(apiKey, 'gemini-3.1-flash-lite', '');
    const result = await service.evaluateLead("I need a web developer");
    console.log(result);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
