import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  jobId: mongoose.Types.ObjectId;
  profileUrl?: string;
  searchQuery?: string;
  postContent: string;
  postUrl?: string;
  postedAt?: string;
  engagementStats?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  score?: number;
  aiReasoning?: string;
  outreachHook?: string;
  isQualified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    profileUrl: { type: String, required: false },
    searchQuery: { type: String, required: false },
    postContent: { type: String, required: true },
    postUrl: { type: String, required: false },
    postedAt: { type: String, required: false },
    engagementStats: {
      likes: { type: Number, required: false },
      comments: { type: Number, required: false },
      shares: { type: Number, required: false },
    },
    score: { type: Number, required: false },
    aiReasoning: { type: String, required: false },
    outreachHook: { type: String, required: false },
    isQualified: { type: Boolean, required: false, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
