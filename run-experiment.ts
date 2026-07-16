import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Lead from './app/models/Lead';
import { ApolloService } from './app/services/ApolloService';

// Load .env
try {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

async function runExperiment() {
  const apolloKey = process.env.APOLLO_API_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!apolloKey || !baseUrl) {
    console.error("Missing APOLLO_API_KEY or NEXT_PUBLIC_APP_URL");
    process.exit(1);
  }

  const apolloService = new ApolloService(apolloKey);

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to DB');

    // Get 3 leads to test
    const leads = await Lead.find({ isQualified: true, profileUrl: { $exists: true, $ne: null } }).limit(3);
    
    if (leads.length === 0) {
      console.log('No qualified leads to test.');
      process.exit(0);
    }

    console.log(`Starting experiment on ${leads.length} leads...`);

    const startTimes: Record<string, number> = {};

    for (const lead of leads) {
      const webhookUrl = `${baseUrl}/api/webhooks/apollo-phone?leadId=${lead._id}`;
      let name = lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : undefined;
      
      console.log(`\n[Requesting] Lead: ${name || lead._id}`);
      startTimes[lead._id.toString()] = Date.now();
      
      // Hit Apollo
      const apolloData = await apolloService.enrichLead(lead.profileUrl, name, webhookUrl);
      
      if (apolloData && apolloData.person) {
        const person = apolloData.person;
        lead.firstPersonalEmail = person.email || undefined;
        lead.apolloPhoneEnrichmentRequested = true; // Webhook sets this to false when done
        await lead.save();
        console.log(` -> Found Email synchronously: ${person.email || 'None'}`);
      }
    }

    console.log('\n--- Waiting for asynchronous Webhooks (Phone Numbers) ---');
    console.log('Polling database every 10 seconds for up to 3 minutes...\n');

    const maxWaitTime = 3 * 60 * 1000; // 3 mins
    const pollInterval = 10 * 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      let pendingCount = 0;

      for (const lead of leads) {
        const dbLead = await Lead.findById(lead._id);
        if (dbLead) {
          if (dbLead.apolloPhoneEnrichmentRequested === false) {
             // Webhook arrived
             if (startTimes[lead._id.toString()]) {
               const timeTaken = ((Date.now() - startTimes[lead._id.toString()]) / 1000).toFixed(1);
               console.log(`✅ Webhook received for ${dbLead.firstName} ${dbLead.lastName} in ${timeTaken} seconds!`);
               console.log(`   Phones: ${dbLead.phones && dbLead.phones.length > 0 ? dbLead.phones.join(', ') : 'None Found'}`);
               delete startTimes[lead._id.toString()]; // Mark as done
             }
          } else {
             pendingCount++;
          }
        }
      }

      if (pendingCount === 0) {
        console.log('\nAll webhooks returned successfully!');
        break;
      }

      await new Promise(r => setTimeout(r, pollInterval));
    }

    if (Object.keys(startTimes).length > 0) {
      console.log('\nExperiment timeout. Some webhooks did not return within 3 minutes.');
    }

  } catch(e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runExperiment();
