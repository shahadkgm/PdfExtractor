import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IauthService } from '../interface/IauthService.js';
import { IauthRepository } from '../../repository/interface/IauthRepository.js';
import { JWT_SECRET } from '../../middleware/authMiddleware.js';

export class AuthService implements IauthService {
  private _authRepository: IauthRepository;

  constructor(authRepository: IauthRepository) {
    this._authRepository = authRepository;
  }

  public async registerUser(email: string | undefined, password: string | undefined): Promise<{ token: string; email: string }> {
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('EMAIL_PASSWORD_REQUIRED');
    }
    const lowerEmail = email.toLowerCase().trim();
    if (!lowerEmail || lowerEmail.length > 254) {
      throw new Error('INVALID_EMAIL_FORMAT');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(lowerEmail)) {
      throw new Error('INVALID_EMAIL_FORMAT');
    }

    if (password.trim().length < 6) {
      throw new Error('WEAK_PASSWORD');
    }

    if (password.length > 12) {
      throw new Error('PASSWORD_TOO_LONG');
    }

    const existingUser = await this._authRepository.findByEmail(lowerEmail);
    if (existingUser) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await this._authRepository.create(lowerEmail, passwordHash);

    const token = jwt.sign(
      { id: newUser._id.toString(), email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, email: newUser.email };
  }

  public async loginUser(email: string | undefined, password: string | undefined): Promise<{ token: string; email: string }> {
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('EMAIL_PASSWORD_REQUIRED');
    }
    const lowerEmail = email.toLowerCase().trim();

    const user = await this._authRepository.findByEmail(lowerEmail);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, email: user.email };
  }
}
