import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { AUTH_PROVIDER } from '@domain/ports/auth.provider.interface';
import type { IAuthProvider } from '@domain/ports/auth.provider.interface';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { User } from '@domain/models/user.model';
import type { RegisterDto } from '@infrastructure/http/dtos/auth/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await this.authProvider.hashPassword(dto.password);

    const user = await this.userRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
    });

    return this.authProvider.generateToken(user);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.validateUser(email, password);
    return this.authProvider.generateToken(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await this.authProvider.comparePasswords(
      password,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
