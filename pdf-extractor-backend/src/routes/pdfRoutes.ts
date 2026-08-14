import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { PDFController } from '../controllers/implementation/pdfController.js';
import { PDFService } from '../services/implementation/pdfService.js';
import { PDFRepository } from '../repository/implementation/pdfRepository.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

const pdfRepository = new PDFRepository();
const pdfService = new PDFService(pdfRepository);
const pdfController = new PDFController(pdfService);

import { Request, Response, NextFunction } from 'express';
import { StatusCode } from '../static/statusCode.js';

// Endpoint for PDF upload
router.post('/upload', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      if (err.message === 'Only PDF files are allowed!') {
        return res.status(StatusCode.BAD_REQUEST).json({ error: err.message });
      }
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: 'File upload error' });
    }
    next();
  });
}, pdfController.uploadPDF);

// Endpoint for page extraction/merge
router.post('/extract', authMiddleware, pdfController.extractPages);

// Endpoint to fetch history list
router.get('/history', authMiddleware, pdfController.getHistory);

// Endpoint to download history item
router.get('/history/download/:id', authMiddleware, pdfController.downloadHistoryItem);

// Endpoint to delete history item
router.delete('/history/:id', authMiddleware, pdfController.deleteHistoryItem);

export default router;
