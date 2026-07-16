const fetch = require('node-fetch');

async function check() {
  try {
    const res = await fetch('http://127.0.0.1:8288/v1/runs');
    if (!res.ok) {
      console.log('Failed to fetch runs:', res.status);
      return;
    }
    const json = await res.json();
    const runs = json.data || json;

    // Find the run for evaluate-leads-job
    const evalRuns = runs.filter(r => r.function_id === 'evaluate-leads-job');
    console.log(`Found ${evalRuns.length} runs for evaluate-leads-job`);

    if (evalRuns.length > 0) {
      const run = evalRuns[0];
      console.log('Latest Run Status:', run.status);
      console.log('Error:', run.error);
      console.log('Steps:', run.steps ? run.steps.length : 'N/A');
    } else {
      console.log(runs.map(r => r.function_id));
    }
  } catch (e) {
    console.error(e.message);
  }
}
check();
