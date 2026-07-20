import { UnauthorizedException } from '@nestjs/common';
import type { IAuthProvider } from '@domain/ports/auth.provider.interface';
import type { ICompanyRepository } from '@domain/ports/company.repository.interface';
import { User } from '@domain/models/user.model';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { AuthService } from './auth.service';

describe('AuthService tenant authentication', () => {
  const setup = () => {
    const users = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;
    const companies = {
      create: jest.fn(),
    } as unknown as jest.Mocked<ICompanyRepository>;
    const auth = {
      comparePasswords: jest.fn().mockResolvedValue(true),
      generateToken: jest.fn().mockReturnValue({ accessToken: 'token' }),
      hashPassword: jest.fn(),
    } as unknown as jest.Mocked<IAuthProvider>;
    return {
      service: new AuthService(users, companies, auth),
      users,
      auth,
    };
  };

  it('rejects valid credentials when the user has no company', async () => {
    const { service, users, auth } = setup();
    users.findByEmail.mockResolvedValue(
      new User({
        id: 'orphan-user',
        email: 'orphan@example.test',
        passwordHash: 'hash',
      }),
    );

    await expect(
      service.login('orphan@example.test', 'password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(auth.generateToken).not.toHaveBeenCalled();
  });
});
