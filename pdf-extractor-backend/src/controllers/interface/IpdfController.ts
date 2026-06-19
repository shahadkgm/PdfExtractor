import { Request, Response } from 'express';

export interface IpdfController {
  uploadPDF(req: Request, res: Response): Promise<void>;
  extractPages(req: Request, res: Response): Promise<void>;
  getHistory(req: Request, res: Response): Promise<void>;
  downloadHistoryItem(req: Request, res: Response): Promise<void>;  
  deleteHistoryItem(req: Request, res: Response): Promise<void>;
}