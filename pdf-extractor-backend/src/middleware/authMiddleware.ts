import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCode } from '../static/statusCode.js';
import { StatusMessage } from '../static/statusMessage.js';

import { JWT_SECRET } from '../static/api.js';
export { JWT_SECRET };

export interface UserPayload {
  id: string;
  email: string;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.AUTH_TOKEN_REQUIRED });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.MALFORMED_AUTH_TOKEN });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(StatusCode.BAD_REQUEST).json({ error: StatusMessage.INVALID_OR_EXPIRED_TOKEN });
  }
};
