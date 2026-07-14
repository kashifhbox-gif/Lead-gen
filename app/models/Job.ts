import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  searchQuery: string;
  apifyRunId?: string;
  status: 'PENDING' | 'SCRAPING' | 'SCRAPED' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
  filters?: {
    postedLimit?: string;
    postedLimitDate?: string;
    sortBy?: string;
    profileScraperMode?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    searchQuery: { type: String, required: true },
    apifyRunId: { type: String, required: false },
    status: {
      type: String,
      enum: ['PENDING', 'SCRAPING', 'SCRAPED', 'EVALUATING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    filters: {
      postedLimit: { type: String, required: false },
      postedLimitDate: { type: String, required: false },
      sortBy: { type: String, required: false },
      profileScraperMode: { type: String, required: false },
    },
  },
  {
    timestamps: true,
  }
);

JobSchema.index({ createdAt: -1 });

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
