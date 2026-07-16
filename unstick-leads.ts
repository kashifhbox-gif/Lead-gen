import mongoose from 'mongoose';
import Lead from './app/models/Lead';
import fs from 'fs';
import path from 'path';

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

async function unstick() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to DB');

  const result = await Lead.updateMany(
    { apolloPhoneEnrichmentRequested: true },
    { $set: { apolloPhoneEnrichmentRequested: false } }
  );

  console.log(`Unstuck ${result.modifiedCount} leads.`);
  await mongoose.disconnect();
}

unstick();
