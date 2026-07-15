import fs from 'fs';
import path from 'path';

try {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

import mongoose from 'mongoose';
import Lead from './app/models/Lead';
import { ApolloService } from './app/services/ApolloService';

async function runTest() {
  const apolloKey = process.env.APOLLO_API_KEY;
  if (!apolloKey) {
    console.error("APOLLO_API_KEY is missing from .env");
    process.exit(1);
  }

  const apolloService = new ApolloService(apolloKey);

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected.');

    // Find 5 qualified leads that have a LinkedIn URL
    const leads = await Lead.find({ 
      isQualified: true, 
      profileUrl: { $exists: true, $ne: null } 
    }).limit(5);

    if (leads.length === 0) {
      console.log('No qualified leads found to test.');
      process.exit(0);
    }

    console.log(`Found ${leads.length} leads. Testing Apollo Enrichment...\n`);

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      console.log(`[Lead ${i + 1}] Profile: ${lead.profileUrl}`);
      
      let name = lead.firstName && lead.lastName ? `${lead.firstName} ${lead.lastName}` : undefined;
      if (!name && lead.postContent) {
        const authorMatch = lead.postContent.match(/Author:\s*([^(\n]+)/i);
        if (authorMatch && authorMatch[1]) {
          name = authorMatch[1].trim();
        }
      }

      console.log(`       Extracted Name: ${name || 'N/A'}`);
      console.log(`       Fetching from Apollo...`);

      try {
        const result = await apolloService.enrichLead(lead.profileUrl, name);
        if (result && result.person) {
          const person = result.person;
          const emails = [];
          if (person.email) emails.push(person.email);
          if (person.personal_emails) emails.push(...person.personal_emails);
          
          const phones = person.phone_numbers ? person.phone_numbers.map((p: any) => p.sanitized_number) : [];

          console.log(`       ✅ SUCCESS!`);
          console.log(`       Emails: ${emails.length > 0 ? emails.join(', ') : 'None found'}`);
          console.log(`       Phones: ${phones.length > 0 ? phones.join(', ') : 'None found'}`);
          console.log(`       Company: ${person.organization ? person.organization.name : 'Unknown'}`);
        } else {
          console.log(`       ❌ Apollo returned success, but no person data found.`);
        }
      } catch (error: any) {
        console.error(`       ❌ FAILED: ${error.message}`);
      }
      
      console.log('----------------------------------------------------');
      
      // Wait a second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error('Test script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
}

runTest();
