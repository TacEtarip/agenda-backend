import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { IAuthProvider } from '@domain/ports/auth.provider.interface';
import { User } from '@domain/models/user.model';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthProviderService implements IAuthProvider {
  constructor(private readonly jwtService: JwtService) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePasswords(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  generateToken(user: User): { accessToken: string } {
    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
    };
    return { accessToken: this.jwtService.sign(payload) };
  }
}
