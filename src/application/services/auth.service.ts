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
import { COMPANY_REPOSITORY } from '@domain/ports/company.repository.interface';
import type { ICompanyRepository } from '@domain/ports/company.repository.interface';
import { User } from '@domain/models/user.model';
import type { RegisterCompanyDto } from '@infrastructure/http/dtos/auth/register-company.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,
    @Inject(AUTH_PROVIDER)
    private readonly authProvider: IAuthProvider,
  ) {}

  async registerCompany(
    dto: RegisterCompanyDto,
  ): Promise<{ accessToken: string }> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const yapeEnabled = dto.yapeEnabled === true;

    // Create the company with its optional direct Yape configuration.
    const company = await this.companyRepository.create({
      name: dto.companyName.trim(),
      yapeEnabled,
      ...(yapeEnabled
        ? {
            yapePhone: dto.yapePhone?.trim(),
            yapeAccountName: dto.yapeAccountName?.trim(),
          }
        : {}),
    });

    const passwordHash = await this.authProvider.hashPassword(dto.password);

    // Create the Admin User linked to the company
    const user = await this.userRepository.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone.trim(),
      passwordHash,
      companyId: company.id,
    });
    user.companyName = company.name;

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
    if (!user?.passwordHash || !user.companyId) {
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
