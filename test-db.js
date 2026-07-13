// Removed dotenv
const mongoose = require('mongoose');

async function testConnection() {
  const uri = "mongodb://kashifhbox_db_user:GOa52R9GUMaN0ZaU@ac-6nwu1ck-shard-00-00.youqr5l.mongodb.net:27017,ac-6nwu1ck-shard-00-01.youqr5l.mongodb.net:27017,ac-6nwu1ck-shard-00-02.youqr5l.mongodb.net:27017/lead_generation?ssl=true&replicaSet=atlas-ohv5oo-shard-0&authSource=admin&retryWrites=true&w=majority";
  if (!uri) {
    console.error('MONGODB_URI is not set in .env');
    return;
  }
  
  console.log('Attempting to connect to MongoDB using URI:', uri.split('@')[1] || uri);
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Successfully connected to MongoDB directly!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to connect directly:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testConnection();
