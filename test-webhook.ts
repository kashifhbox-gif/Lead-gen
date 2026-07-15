import mongoose from 'mongoose';
import Lead from './app/models/Lead';
import fs from 'fs';
import path from 'path';

async function run() {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  const match = envFile.match(/MONGODB_URI=([^\n\r]+)/);
  const uri = match ? match[1].trim().replace(/^"|"$/g, '') : '';

  await mongoose.connect(uri);
  const lead = await Lead.findOne({}).sort({createdAt: -1});
  
  if (!lead) {
    console.log("No lead found");
    process.exit(0);
  }

  const leadId = lead._id.toString();
  console.log("Testing Webhook with Lead ID:", leadId);

  // Fake Apollo Webhook Payload
  const payload = {
    contact: {
      first_name: "Test",
      last_name: "User",
      phone_numbers: [
        {
          raw_number: "+1 555 123 4567",
          sanitized_number: "+15551234567"
        }
      ]
    }
  };

  const response = await fetch(`http://localhost:3000/api/webhooks/apollo-phone?leadId=${leadId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log("Webhook Response Status:", response.status);
  console.log("Webhook Response Body:", text);

  process.exit(0);
}

run();
