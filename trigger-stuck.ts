import connectToDatabase from './app/lib/db.js';
import Lead from './app/models/Lead.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fixStuckLeads() {
  await connectToDatabase();
  console.log('Connected to DB');

  const result = await Lead.updateMany(
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
}

fixStuckLeads();