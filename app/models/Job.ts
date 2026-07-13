import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  searchQuery: string;
  apifyRunId?: string;
  status: 'PENDING' | 'SCRAPING' | 'SCRAPED' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
  filters?: {
    postedLimit?: string;
    postedLimitDate?: string;
    sortBy?: string;
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
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
