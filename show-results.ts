import mongoose from 'mongoose';
import Lead from './app/models/Lead';
import fs from 'fs';
import path from 'path';

async function run() {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  const match = envFile.match(/MONGODB_URI=([^\n\r]+)/);
  const uri = match ? match[1].trim().replace(/^"|"$/g, '') : '';

  await mongoose.connect(uri);

  const leads = await Lead.find({ profileUrl: { $exists: true, $ne: "" } })
                          .sort({ createdAt: -1 })
                          .limit(15);
  
  let foundPhones = 0;
  let foundEmails = 0;

  console.log("=== RESULTS FOR LAST 15 LEADS ===\n");

  leads.forEach((lead, i) => {
    const hasPhone = lead.phones && lead.phones.length > 0;
    const hasEmail = lead.allEmails && lead.allEmails.length > 0;
    
    if (hasPhone) foundPhones++;
    if (hasEmail) foundEmails++;

    console.log(`${i + 1}. Name: ${lead.firstName || ''} ${lead.lastName || ''}`);
    console.log(`   Profile: ${lead.profileUrl}`);
    console.log(`   Phones: ${hasPhone ? lead.phones.join(', ') : 'None (or Webhook pending...)'}`);
    console.log(`   Emails: ${hasEmail ? lead.allEmails.join(', ') : 'None'}`);
    console.log('-----------------------------------');
  });

  console.log(`\nSUMMARY: Out of 15 leads, ${foundEmails} have emails, and ${foundPhones} have phones.`);
  if (foundPhones === 0) {
    console.log("Note: Apollo's phone enrichment via webhook usually takes 5-15 minutes.");
    console.log("If the phone count is 0, the webhooks likely haven't arrived yet! Try running this again in a few minutes.");
  }
  
  process.exit(0);
}

run();
