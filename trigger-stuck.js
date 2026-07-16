require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('leads').updateMany(
    {
      $or: [
        { apolloEmailEnrichmentRequested: true },
        { apolloPhoneEnrichmentRequested: true }
      ]
    },
    {
      $set: {
        apolloEmailEnrichmentRequested: false,
        apolloPhoneEnrichmentRequested: false
      }
    }
  );
  console.log('Fixed stuck leads:', result);
  mongoose.connection.close();
});
