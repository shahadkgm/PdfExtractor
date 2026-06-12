import { Response } from 'express';
import { StatusCode } from '../../static/statusCode.js';
import { StatusMessage } from '../../static/statusMessage.js';
import { AuthenticatedRequest } from '../../middleware/authMiddleware.js';
import { IpdfController } from '../interface/IpdfController.js';
import { IpdfService } from '../../services/interface/IpdfService.js';

export class PDFController implements IpdfController {
  private pdfService: IpdfService;

  constructor(pdfService: IpdfService) {
    this.pdfService = pdfService;
  }

  // controller to upload and process PDF file
  public uploadPDF = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.pdfService.processUploadedPDF(req.file);
      res.json(result);
    } catch (error: unknown) {
      console.error('Error uploading PDF:', error);
      
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage === 'NO_FILE_UPLOADED') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.NO_FILE_UPLOADED });
        return;
      }
      if (errorMessage === 'FILE_NOT_FOUND') {
        res.status(StatusCode.NOT_FOUND).json({ error: StatusMessage.FILE_NOT_FOUND });
        return;
      }
      
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: StatusMessage.FAILED_PROCESS_PDF });
    }
  };

  // controller to extract specified pages
  public extractPages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const fileId = typeof req.body.fileId === 'string' ? req.body.fileId : undefined;
      const pages = Array.isArray(req.body.pages) ? req.body.pages as number[] : undefined;
      const originalName = typeof req.body.originalName === 'string' ? req.body.originalName : undefined;
      const userId = req.user?.id;

      const pdfBytes = await this.pdfService.extractAndSavePages(
        userId,
        fileId,
        pages,
        originalName
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="pdfcraft_extracted.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } catch (error: unknown) {
      console.error('Error extracting pages:', error);
      
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage === 'MISSING_FILE_ID') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.MISSING_FILE_ID });
        return;
      }
      if (errorMessage === 'INVALID_PAGES_LIST') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.INVALID_PAGES_LIST });
        return;
      }
      if (errorMessage === 'FILE_NOT_FOUND') {
        res.status(StatusCode.NOT_FOUND).json({ error: StatusMessage.FILE_NOT_FOUND });
        return;
      }
      
      if (errorMessage.startsWith('INVALID_PAGE_NUMBER:')) {
        const parts = errorMessage.split(':');
        const invalidPage = parts[1];
        const totalPages = parts[2];
        res.status(StatusCode.BAD_REQUEST).json({ 
          error: `${StatusMessage.INVALID_PAGE_NUMBER_PREFIX}${invalidPage}${StatusMessage.TOTAL_PAGES_PREFIX}${totalPages}` 
        });
        return;
      }

      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: StatusMessage.FAILED_EXTRACT_PAGES });
    }
  };

  // get user extraction history (up to 4 items)
  public getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const extractions = await this.pdfService.getHistory(userId);
      res.json(extractions);
    } catch (error: unknown) {
      console.error('Error fetching history:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage === 'USER_ID_MISSING') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.USER_ID_MISSING });
        return;
      }
      if (errorMessage === 'INVALID_USER_ID') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.INVALID_USER_ID });
        return;
      }
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: StatusMessage.FAILED_FETCH_HISTORY });
    }
  };

  // download historical copy
  public downloadHistoryItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = typeof req.params.id === 'string' ? req.params.id : undefined;
      const userId = req.user?.id;

      const extraction = await this.pdfService.downloadHistoryItem(id, userId);

      const baseName = extraction.originalFileName.replace(/\.[^/.]+$/, "");
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}_extracted.pdf"`);
      res.sendFile(extraction.filePath);
    } catch (error: unknown) {
      console.error('Error downloading history item:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage === 'MISSING_EXTRACTION_ID') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.MISSING_EXTRACTION_ID });
        return;
      }
      if (errorMessage === 'USER_ID_MISSING') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.USER_ID_MISSING });
        return;
      }
      if (errorMessage === 'INVALID_EXTRACTION_ID') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.INVALID_EXTRACTION_ID });
        return;
      }
      if (errorMessage === 'INVALID_USER_ID') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.INVALID_USER_ID });
        return;
      }
      if (errorMessage === 'EXTRACTION_NOT_FOUND') {
        res.status(StatusCode.NOT_FOUND).json({ error: StatusMessage.EXTRACTION_NOT_FOUND });
        return;
      }
      if (errorMessage === 'FILE_NOT_FOUND') {
        res.status(StatusCode.NOT_FOUND).json({ error: StatusMessage.PHYSICAL_FILE_REMOVED });
        return;
      }
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: StatusMessage.FAILED_DOWNLOAD_HISTORY });
    }
  };
}
