import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { IpdfService } from '../interface/IpdfService.js';
import { IpdfRepository } from '../../repository/interface/IpdfRepository.js';
import { uploadDir } from '../../middleware/upload.js';
import { IExtraction } from '../../models/Extraction.js';
import mongoose from 'mongoose';

export class PDFService implements IpdfService {
  private pdfRepository: IpdfRepository;
  private uploadDir: string;

  constructor(pdfRepository: IpdfRepository) {
    this.pdfRepository = pdfRepository;
    this.uploadDir = uploadDir;
  }

  public async processUploadedPDF(file: Express.Multer.File | undefined): Promise<{ fileId: string; originalName: string; pageCount: number }> {
    if (!file) {
      throw new Error('NO_FILE_UPLOADED');
    }
    const pageCount = await this.getPageCount(file.path);
    return {
      fileId: file.filename,
      originalName: file.originalname,
      pageCount,
    };
  }

  public async getPageCount(filePath: string): Promise<number> {
    if (!fs.existsSync(filePath)) {
      throw new Error('FILE_NOT_FOUND');
    }
    const fileBuffer = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(fileBuffer);
    return pdfDoc.getPageCount();
  }

  public async extractPages(sourcePath: string, pages: number[]): Promise<Uint8Array> {
    if (!fs.existsSync(sourcePath)) {
      throw new Error('FILE_NOT_FOUND');
    }

    const sourceBuffer = fs.readFileSync(sourcePath);
    const sourcePdf = await PDFDocument.load(sourceBuffer);
    const sourcePageCount = sourcePdf.getPageCount();

    const destPdf = await PDFDocument.create();
    const indicesToCopy: number[] = [];

    for (const pageNum of pages) {
      const parsedNum = Number(pageNum);
      if (isNaN(parsedNum) || parsedNum < 1 || parsedNum > sourcePageCount) {
        throw new Error(`INVALID_PAGE_NUMBER:${parsedNum}:${sourcePageCount}`);
      }
      indicesToCopy.push(parsedNum - 1);
    }

    const copiedPages = await destPdf.copyPages(sourcePdf, indicesToCopy);
    copiedPages.forEach((page) => destPdf.addPage(page));

    return await destPdf.save();
  }

  public async extractAndSavePages(
    userId: string | undefined,
    fileId: string | undefined,
    pages: number[] | undefined,
    originalName: string | undefined
  ): Promise<Uint8Array> {
    if (!fileId || typeof fileId !== 'string') {
      throw new Error('MISSING_FILE_ID');
    }
    if (!Array.isArray(pages) || pages.length === 0) {
      throw new Error('INVALID_PAGES_LIST');
    }
    const resolvedUserId = userId || 'anonymous';
    const sourcePath = path.join(this.uploadDir, resolvedUserId, fileId);
    
    const numberPages = pages.map(p => Number(p));
    const pdfBytes = await this.extractPages(sourcePath, numberPages);

    if (mongoose.Types.ObjectId.isValid(resolvedUserId)) {
      const extractionsDir = path.join(this.uploadDir, resolvedUserId, 'extractions');
      if (!fs.existsSync(extractionsDir)) {
        fs.mkdirSync(extractionsDir, { recursive: true });
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extractedFileName = `extracted-${uniqueSuffix}.pdf`;
      const destPath = path.join(extractionsDir, extractedFileName);

      // Save physical file
      fs.writeFileSync(destPath, Buffer.from(pdfBytes));

      // Save record in MongoDB
      const resolvedOriginalName = typeof originalName === 'string' ? originalName : 'Document.pdf';
      await this.pdfRepository.createExtraction(
        resolvedUserId,
        resolvedOriginalName,
        extractedFileName,
        destPath,
        numberPages
      );

      // Enforce the 4-copy retention limit
      const extractions = await this.pdfRepository.findExtractionsByUserId(resolvedUserId);
      if (extractions.length > 4) {
        const toDelete = extractions.slice(4); // Keep newest 4 (0, 1, 2, 3)
        for (const record of toDelete) {
          try {
            if (fs.existsSync(record.filePath)) {
              fs.unlinkSync(record.filePath);
            }
          } catch (err) {
            console.error('Failed to delete physical file:', err);
          }
          await this.pdfRepository.deleteExtraction(record._id.toString());
        }
      }
    }

    return pdfBytes;
  }

  public async getHistory(userId: string | undefined): Promise<IExtraction[]> {
    if (!userId) {
      throw new Error('USER_ID_MISSING');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('INVALID_USER_ID');
    }
    return await this.pdfRepository.findExtractionsByUserId(userId);
  }

  public async downloadHistoryItem(id: string | undefined, userId: string | undefined): Promise<IExtraction> {
    if (!id) {
      throw new Error('MISSING_EXTRACTION_ID');
    }
    if (!userId) {
      throw new Error('USER_ID_MISSING');
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('INVALID_EXTRACTION_ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('INVALID_USER_ID');
    }

    const extraction = await this.pdfRepository.findExtractionByIdAndUserId(id, userId);
    if (!extraction) {
      throw new Error('EXTRACTION_NOT_FOUND');
    }

    if (!fs.existsSync(extraction.filePath)) {
      throw new Error('FILE_NOT_FOUND');
    }

    return extraction;
  }
}
