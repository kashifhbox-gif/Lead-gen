import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Lead from './app/models/Lead';

try {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
} catch (e) {}

async function checkResults() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to DB');

    // Find leads where apolloEmailEnrichmentRequested is true
    const leads = await Lead.find({ apolloEmailEnrichmentRequested: true }).sort({ updatedAt: -1 }).limit(20);
    
    console.log(`Found ${leads.length} leads with Apollo enrichment requested recently.`);
    
    let phoneCount = 0;
    let emailCount = 0;
    
    leads.forEach(lead => {
      const hasEmail = !!lead.firstPersonalEmail || (lead.allEmails && lead.allEmails.length > 0);
      const hasPhone = lead.phones && lead.phones.length > 0;
      
      if (hasEmail) emailCount++;
      if (hasPhone) phoneCount++;
      
      console.log(`Lead ID: ${lead._id} | Name: ${lead.firstName} ${lead.lastName} | Phone: ${hasPhone ? lead.phones.join(', ') : 'None'} | Email: ${hasEmail ? lead.firstPersonalEmail : 'None'} | Updated: ${lead.updatedAt}`);
    });
    
    console.log(`\nSummary: ${emailCount} emails found, ${phoneCount} phones found.`);
    
  } catch(e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
  }
}

checkResults();
