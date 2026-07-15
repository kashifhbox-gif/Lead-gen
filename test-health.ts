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

async function testHealth() {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return console.log('No API key');
  
  const response = await fetch('https://api.apollo.io/api/v1/auth/health', {
    headers: {
      'Cache-Control': 'no-cache',
      'X-Api-Key': apiKey
    }
  });
  
  console.log('Status:', response.status);
  console.log(await response.text());
}

testHealth();
