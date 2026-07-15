const mongoose = require('mongoose');

async function triggerStuckJobs() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const { Inngest } = require('inngest');
  const inngest = new Inngest({ id: "app-tmp" });

  const stuckJobs = await db.collection('jobs').find({ status: 'SCRAPED' }).toArray();
  for (const job of stuckJobs) {
    console.log(`Triggering evaluation for stuck job: ${job._id}`);
    await inngest.send({
      name: 'app/evaluate.leads',
      data: { jobId: job._id.toString() }
    });
  }
  console.log('Done!');
  process.exit(0);
}

triggerStuckJobs();