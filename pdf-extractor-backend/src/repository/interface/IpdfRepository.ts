import { IExtraction } from '../../models/Extraction.js';

export interface IpdfRepository {
  createExtraction(
    userId: string,
    originalFileName: string,
    extractedFileName: string,
    filePath: string,
    pages: number[]
  ): Promise<IExtraction>;
  findExtractionsByUserId(userId: string): Promise<IExtraction[]>;
  findExtractionByIdAndUserId(id: string, userId: string): Promise<IExtraction | null>;
  deleteExtraction(id: string): Promise<void>;
}
