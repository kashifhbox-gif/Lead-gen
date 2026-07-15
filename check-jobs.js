const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
const match = envFile.match(/MONGODB_URI=([^\n\r]+)/);
const uri = match ? match[1].trim().replace(/^"|"$/g, '') : null;

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const jobs = await db.collection('jobs').find({}).sort({createdAt: -1}).limit(5).toArray();
  console.log("Recent Jobs:");
  jobs.forEach(j => console.log(`- ID: ${j._id}, Status: ${j.status}, EmailStatus: ${j.emailEnrichmentStatus}`));
  mongoose.disconnect();
});
