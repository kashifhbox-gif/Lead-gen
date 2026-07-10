import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  profileUrl: string;
  apifyRunId?: string;
  status: 'PENDING' | 'SCRAPING' | 'SCRAPED' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    profileUrl: { type: String, required: true },
    apifyRunId: { type: String, required: false },
    status: {
      type: String,
      enum: ['PENDING', 'SCRAPING', 'SCRAPED', 'EVALUATING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
