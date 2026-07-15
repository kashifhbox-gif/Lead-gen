import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  aiPrompt?: string;
  apifyApiKey?: string;
  geminiApiKey?: string;
  geminiModel?: string;
  apolloApiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true
    },
    passwordHash: { 
      type: String, 
      required: true 
    },
    aiPrompt: {
      type: String,
      required: false,
      default: `You are an expert B2B Lead Generation AI.
Analyze the following LinkedIn post and determine if the author is a high-quality lead based on the search intent provided.

Score them from 0 to 10 based on these rules:
- 9-10: User explicitly states they are looking to hire, need a service built/provided, or are actively seeking a partner.
- 7-8: User is asking for recommendations or discussing a new project they want to launch.
- 4-6: User is discussing general topics related to the search intent but not explicitly hiring.
- 0: User is promoting their own services (a competitor), selling courses, or discussing completely unrelated topics.

Provide a short 1-2 sentence reasoning for your score.`
    },
    apifyApiKey: {
      type: String,
      required: false
    },
    geminiApiKey: {
      type: String,
      required: false
    },
    geminiModel: {
      type: String,
      required: false,
      default: 'gemini-2.5-flash'
    },
    apolloApiKey: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
