import { Request, Response } from 'express';

export interface IauthController {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;  
}