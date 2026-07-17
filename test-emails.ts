import mongoose from 'mongoose';
import Lead from './app/models/Lead';
import { ApolloService } from './app/services/ApolloService';
import fs from 'fs';
import path from 'path';

async function run() {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  
  const getEnv = (key: string) => {
    const match = envFile.match(new RegExp(`${key}=([^\\n\\r]+)`));
    return match ? match[1].trim().replace(/^"|"$/g, '') : '';
  };

  const uri = getEnv('MONGODB_URI');
  const apolloKey = getEnv('APOLLO_API_KEY');
  
  await mongoose.connect(uri);

  const leads = await Lead.find({ profileUrl: { $exists: true, $ne: "" } })
                          .sort({ createdAt: -1 })
                          .limit(5); // just test the last 5 this time
  
  const apolloService = new ApolloService(apolloKey);

  const payload = leads.map(l => ({
    linkedinUrl: l.profileUrl,
    name: (l.firstName || '') + ' ' + (l.lastName || '')
  }));

  try {
    const response = await apolloService.bulkEnrichLeads(payload, 'https://example.com/api/webhooks/apollo');
    
    console.log("=== IMMEDIATE MATCHES RETURNED BY APOLLO ===");
    const matches = response.matches || [];
    
    matches.forEach((person: any, index: number) => {
      if (!person) {
        console.log(`\nMatch ${index + 1}: Null (No Match Found)`);
        return;
      }
      console.log(`\nMatch ${index + 1}: ${person.first_name || ''} ${person.last_name || ''}`);
      console.log(`Email: ${person.email || 'None'}`);
      console.log(`Personal Emails: ${person.personal_emails ? person.personal_emails.join(', ') : 'None'}`);
    });

  } catch (e: any) {
    console.error(`Error:`, e.message);
  }

  process.exit(0);
}

run();
