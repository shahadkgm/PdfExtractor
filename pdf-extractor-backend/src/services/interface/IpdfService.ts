import { IExtraction } from '../../models/Extraction.js';

export interface IpdfService {
  processUploadedPDF(file: Express.Multer.File | undefined, userId: string | undefined): Promise<{ fileId: string; originalName: string; pageCount: number }>;
  getPageCount(userId: string | undefined, fileId: string | undefined): Promise<number>;
  extractPages(userId: string | undefined, fileId: string | undefined, pages: number[]): Promise<Uint8Array>;
  extractAndSavePages(
    userId: string | undefined,
    fileId: string | undefined,
    pages: number[] | undefined,
    originalName: string | undefined
  ): Promise<Uint8Array>;
  getHistory(userId: string | undefined): Promise<IExtraction[]>;
  downloadHistoryItem(id: string | undefined, userId: string | undefined): Promise<IExtraction>;
  deleteHistoryItem(id: string | undefined, userId: string | undefined): Promise<void>;
}
