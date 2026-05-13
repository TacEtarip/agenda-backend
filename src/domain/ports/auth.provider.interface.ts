import { User } from '@domain/models/user.model';

export const AUTH_PROVIDER = 'AUTH_PROVIDER';

export interface IAuthProvider {
  hashPassword(password: string): Promise<string>;
  comparePasswords(plain: string, hash: string): Promise<boolean>;
  generateToken(user: User): { accessToken: string };
}
