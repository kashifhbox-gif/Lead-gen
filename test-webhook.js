// test-webhook.js
// This script simulates the payload that Apify sends to your webhook.
// You must provide a valid jobId from your database and a valid Apify runId.

async function testWebhook() {
  // 1. Replace these with actual IDs from your system
  const jobId = 'REPLACE_WITH_VALID_JOB_ID'; 
  const runId = 'REPLACE_WITH_VALID_APIFY_RUN_ID';

  console.log(`Testing webhook for Job ID: ${jobId} and Run ID: ${runId}...`);

  try {
    const response = await fetch(`http://localhost:3000/api/webhooks/apify?jobId=${jobId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // This is the exact payload structure Apify sends
      body: JSON.stringify({
        userId: "test_user",
        createdAt: new Date().toISOString(),
        eventType: "ACTOR.RUN.SUCCEEDED",
        eventData: {
          actorId: "harvestapi/linkedin-post-search",
          actorRunId: runId
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Webhook succeeded!', data);
    } else {
      console.error(`❌ Webhook failed with status ${response.status}:`, data);
    }
  } catch (error) {
    console.error('❌ Error sending webhook request:', error);
  }
}

testWebhook();
