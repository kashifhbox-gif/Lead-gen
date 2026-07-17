import mongoose from 'mongoose';
import Lead from './app/models/Lead';
import fs from 'fs';
import path from 'path';

async function run() {
  const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
  const match = envFile.match(/MONGODB_URI=([^\n\r]+)/);
  const uri = match ? match[1].trim().replace(/^"|"$/g, '') : '';

  await mongoose.connect(uri);
  // Find a random lead to simulate the bulk match
  const lead = await Lead.findOne({}).sort({createdAt: -1});
  
  if (!lead) {
    console.log("No lead found");
    process.exit(0);
  }

  const profileUrl = lead.profileUrl || 'http://www.linkedin.com/in/dummy';
  console.log(`Testing Bulk Webhook with Lead Profile: ${profileUrl}`);

  // Fake Apollo Bulk Webhook Payload based on the docs
  const payload = {
    status: "success",
    people: [
      {
        linkedin_url: profileUrl,
        first_name: "Bulk",
        last_name: "Tester",
        email: "bulk.tester@example.com",
        phone_numbers: [
          {
            sanitized_number: "+18005559999"
          }
        ]
      }
    ]
  };

  const appUrlMatch = envFile.match(/NEXT_PUBLIC_APP_URL=([^\n\r]+)/);
  const appUrl = appUrlMatch ? appUrlMatch[1].trim() : 'http://localhost:3000';
  const webhookUrl = `${appUrl}/api/webhooks/apollo`;

  console.log(`Sending payload to ${webhookUrl}...`);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log("Bulk Webhook Response Status:", response.status);
  console.log("Bulk Webhook Response Body:", text);

  process.exit(0);
}

run();
