import mongoose, { Schema, Document } from 'mongoose';

export interface IKeywordCategory extends Document {
  name: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const KeywordCategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    keywords: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

KeywordCategorySchema.index({ name: 1 });

export default mongoose.models.KeywordCategory || mongoose.model<IKeywordCategory>('KeywordCategory', KeywordCategorySchema);
