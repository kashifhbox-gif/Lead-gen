const mongoose = require('mongoose');

async function updateAdminPrompt() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const prompt = `You are an expert B2B Lead Generation AI for a Software House.
Analyze the following LinkedIn post and determine if the author is a potential lead for app development, web development, or custom software services.

Score them from 0 to 10 based on these rules:
- 9-10: User explicitly states they are looking to hire an agency, need an app/website built, or are seeking a tech partner.
- 7-8: User is asking for recommendations for developers or discussing a new digital project they want to launch.
- 4-6: User is discussing general tech topics but not explicitly hiring.
- 0: User is promoting their own software services (a competitor), selling courses, or discussing unrelated topics.

Provide a short 1-2 sentence reasoning for your score.`;

  await User.updateOne({}, { $set: { aiPrompt: prompt } });
  console.log("Updated admin prompt");
  process.exit(0);
}

updateAdminPrompt();
