import fs from 'fs';
import path from 'path';

// Load env before anything else
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
    }
  });
}

async function fix() {
  try {
    const { default: connectToDatabase } = await import('./app/lib/db');
    const { default: Lead } = await import('./app/models/Lead');
    await connectToDatabase();
    
    const stuckLeads = await Lead.find({
      apolloEmailEnrichmentRequested: true,
      apolloPhoneEnrichmentRequested: false
    });
    
    console.log(`Found ${stuckLeads.length} leads stuck in the impossible state.`);
    
    for (const lead of stuckLeads) {
      lead.apolloEmailEnrichmentRequested = false;
      await lead.save();
    }
    
    console.log('Fixed stuck leads.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

fix();
