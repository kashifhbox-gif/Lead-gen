const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const jobs = await db.collection('jobs').find({}).toArray();
  console.log(jobs.map(j => ({ id: j._id, q: j.searchQuery, s: j.status })));
  process.exit(0);
}
check();
