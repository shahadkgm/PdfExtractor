import mongoose, { Schema, Document } from 'mongoose';

export interface IExtraction extends Document {
  userId: mongoose.Types.ObjectId;
  originalFileName: string;
  extractedFileName: string;
  filePath: string;
  pages: number[];
  createdAt: Date;
}

const ExtractionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  originalFileName: { type: String, required: true },
  extractedFileName: { type: String, required: true },
  filePath: { type: String, required: true },
  pages: [{ type: Number, required: true }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IExtraction>('Extraction', ExtractionSchema);
