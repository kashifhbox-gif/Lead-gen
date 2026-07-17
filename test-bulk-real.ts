import mongoose from 'mongoose';
import Lead from './app/models/Lead';
import { ApolloService } from './app/services/ApolloService';
import fs from 'fs';
import path from 'path';

async function run() {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  
  // Extract values from .env
  const getEnv = (key: string) => {
    const match = envFile.match(new RegExp(`${key}=([^\\n\\r]+)`));
    return match ? match[1].trim().replace(/^"|"$/g, '') : '';
  };

  const uri = getEnv('MONGODB_URI');
  const apolloKey = getEnv('APOLLO_API_KEY');
  const appUrl = getEnv('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';
  
  const webhookUrl = `${appUrl}/api/webhooks/apollo`;

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.");

  // Get the last 15 leads
  const leads = await Lead.find({ profileUrl: { $exists: true, $ne: "" } })
                          .sort({ createdAt: -1 })
                          .limit(15);
  
  if (leads.length === 0) {
    console.log("No leads found with a LinkedIn profile URL.");
    process.exit(0);
  }

  console.log(`Found ${leads.length} leads. Beginning real bulk enrichment test...`);
  console.log(`Using Webhook URL: ${webhookUrl}\n`);

  const apolloService = new ApolloService(apolloKey);

  // Chunk into sizes of 10 (Apollo's limit)
  const chunkSize = 10;
  for (let i = 0; i < leads.length; i += chunkSize) {
    const chunk = leads.slice(i, i + chunkSize);
    
    console.log(`--- Processing Chunk ${Math.floor(i/chunkSize) + 1} (Size: ${chunk.length}) ---`);
    const payload = chunk.map(l => ({
      linkedinUrl: l.profileUrl,
      name: (l.firstName || '') + ' ' + (l.lastName || '')
    }));

    try {
      const response = await apolloService.bulkEnrichLeads(payload, webhookUrl);
      console.log(`Chunk ${Math.floor(i/chunkSize) + 1} Response:`);
      console.log(`Request ID: ${response.request_id}`);
      
      // Print immediate matches (emails/demographics)
      const matches = response.matches || [];
      console.log(`Immediate Matches found: ${matches.length}`);
      
    } catch (e: any) {
      console.error(`Error processing chunk:`, e.message);
    }
    console.log("\n");
  }

  console.log("Done initiating requests!");
  console.log("Keep your dev server and ngrok running. Webhooks should arrive at your ngrok URL in a few minutes.");
  process.exit(0);
}

run();
