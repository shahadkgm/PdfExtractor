import { Request, Response } from 'express';
import { StatusCode } from '../../static/statusCode.js';
import { StatusMessage } from '../../static/statusMessage.js';
import { IauthController } from '../interface/IauthController.js';
import { IauthService } from '../../services/interface/IauthService.js';

export class AuthController implements IauthController {
  private _authService: IauthService;

  constructor(authService: IauthService) {
    this._authService = authService;
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this._authService.registerUser(email, password);
      res.status(StatusCode.CREATED).json(result);
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage === 'EMAIL_PASSWORD_REQUIRED') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.EMAIL_PASSWORD_REQUIRED });
        return;
      }
      if (errorMessage === 'INVALID_EMAIL_FORMAT') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.INVALID_EMAIL_FORMAT });
        return;
      }
      if (errorMessage === 'WEAK_PASSWORD') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.WEAK_PASSWORD });
        return;
      }
      if (errorMessage === 'PASSWORD_TOO_LONG') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.PASSWORD_TOO_LONG });
        return;
      }
      if (errorMessage === 'USER_ALREADY_EXISTS') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.USER_ALREADY_EXISTS_MSG });
        return;
      }
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: StatusMessage.REGISTRATION_FAILED });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this._authService.loginUser(email, password);
      res.json(result);
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage === 'EMAIL_PASSWORD_REQUIRED') {
        res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.EMAIL_PASSWORD_REQUIRED });
        return;
      }
      if (errorMessage === 'INVALID_CREDENTIALS') {
        res.status(StatusCode.UNAUTHORIZED).json({ error: StatusMessage.INVALID_CREDENTIALS });
        return;
      }
      res.status(StatusCode.INTERNAL_SERVER_ERROR).json({ error: StatusMessage.LOGIN_FAILED });
    }
  };
}
