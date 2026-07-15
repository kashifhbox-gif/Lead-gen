import { ApolloService } from './app/services/ApolloService';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
    const match = envFile.match(/APOLLO_API_KEY=([^\n\r]+)/);
    const key = match ? match[1].trim().replace(/^"|"$/g, '') : '';
    
    const s = new ApolloService(key);
    
    // Pass the webhook URL now
    console.log("Testing Apollo API with webhook_url...");
    const res = await s.enrichLeadPhone(
      'https://www.linkedin.com/in/eli-ken-dror/', 
      undefined, 
      'https://sacrifice-palm-compost.ngrok-free.dev/api/webhooks/apollo-phone?leadId=dummy123'
    );
    
    console.log("Apollo Response:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
}
main();
