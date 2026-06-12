import { IUser } from '../../models/User.js';

export interface IauthRepository {
  findByEmail(email: string): Promise<IUser | null>;
  create(email: string, passwordHash: string): Promise<IUser>;
}
