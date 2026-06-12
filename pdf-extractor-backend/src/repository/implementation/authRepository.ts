import { IauthRepository } from '../interface/IauthRepository.js';
import User, { IUser } from '../../models/User.js';

export class AuthRepository implements IauthRepository {
  public async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  public async create(email: string, passwordHash: string): Promise<IUser> {
    return await User.create({ email, passwordHash });
  }
}
