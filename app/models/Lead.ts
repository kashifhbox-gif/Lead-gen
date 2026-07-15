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
  firstName?: string;
  lastName?: string;
  firstPersonalEmail?: string;
  personalEmails?: string[];
  phones?: string[];
  apolloEnrichmentAttempted?: boolean;
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
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    firstPersonalEmail: { type: String, required: false },
    personalEmails: [{ type: String, required: false }],
    phones: [{ type: String, required: false }],
    apolloEnrichmentAttempted: { type: Boolean, required: false, default: false },
  },
  {
    timestamps: true,
  }
);

LeadSchema.index({ isQualified: 1, createdAt: -1 });
LeadSchema.index({ jobId: 1 });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
