const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://kashifhbox_db_user:GOa52R9GUMaN0ZaU@ac-6nwu1ck-shard-00-00.youqr5l.mongodb.net:27017,ac-6nwu1ck-shard-00-01.youqr5l.mongodb.net:27017,ac-6nwu1ck-shard-00-02.youqr5l.mongodb.net:27017/lead_generation?ssl=true&replicaSet=atlas-ohv5oo-shard-0&authSource=admin&retryWrites=true&w=majority";

async function checkLeads() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  
  const leads = await db.collection('leads').find({ jobId: new mongoose.Types.ObjectId("6a590ec706be77d66325d451") }).toArray();
  console.log(`Total leads for job: ${leads.length}`);
  
  const evaluated = leads.filter(l => l.score !== undefined);
  console.log(`Evaluated leads: ${evaluated.length}`);
  
  if (evaluated.length > 0) {
    console.log("Sample evaluated lead:", evaluated[0].score);
  } else if (leads.length > 0) {
    console.log("Sample unevaluated lead:", leads[0].postContent.substring(0, 50));
  }
  
  process.exit(0);
}
checkLeads();
