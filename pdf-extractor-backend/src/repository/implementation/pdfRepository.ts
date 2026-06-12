import { IpdfRepository } from '../interface/IpdfRepository.js';
import Extraction, { IExtraction } from '../../models/Extraction.js';
import mongoose from 'mongoose';

export class PDFRepository implements IpdfRepository {
  public async createExtraction(
    userId: string,
    originalFileName: string,
    extractedFileName: string,
    filePath: string,
    pages: number[]
  ): Promise<IExtraction> {
    return await Extraction.create({
      userId: new mongoose.Types.ObjectId(userId),
      originalFileName,
      extractedFileName,
      filePath,
      pages,
    });
  }

  public async findExtractionsByUserId(userId: string): Promise<IExtraction[]> {
    return await Extraction.find({ userId: userId }).sort({ createdAt: -1 });
  }

  public async findExtractionByIdAndUserId(id: string, userId: string): Promise<IExtraction | null> {
    return await Extraction.findOne({ _id: id, userId: userId });
  }

  public async deleteExtraction(id: string): Promise<void> {
    await Extraction.deleteOne({ _id: id });
  }
}
