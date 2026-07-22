import { UnauthorizedException } from '@nestjs/common';
import type { IAuthProvider } from '@domain/ports/auth.provider.interface';
import type { ICompanyRepository } from '@domain/ports/company.repository.interface';
import { Company } from '@domain/models/company.model';
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
      companies,
      auth,
    };
  };

  it('creates the company with the optional Yape configuration', async () => {
    const { service, users, companies, auth } = setup();
    users.findByEmail.mockResolvedValue(null);
    companies.create.mockResolvedValue(
      Object.assign(new Company('company-1', 'Agenda Test'), {
        yapeEnabled: true,
        yapePhone: '987654321',
        yapeAccountName: 'Ada Lovelace',
      }),
    );
    auth.hashPassword.mockResolvedValue('password-hash');
    users.create.mockResolvedValue(
      new User({
        id: 'user-1',
        email: 'ada@example.test',
        companyId: 'company-1',
        passwordHash: 'password-hash',
      }),
    );

    await service.registerCompany({
      companyName: 'Agenda Test',
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+51987654321',
      email: 'ada@example.test',
      password: 'password123',
      yapeEnabled: true,
      yapePhone: '987654321',
      yapeAccountName: 'Ada Lovelace',
    });

    expect(companies.create).toHaveBeenCalledWith({
      name: 'Agenda Test',
      yapeEnabled: true,
      yapePhone: '987654321',
      yapeAccountName: 'Ada Lovelace',
    });
    expect(auth.generateToken).toHaveBeenCalledWith(
      expect.objectContaining({ companyName: 'Agenda Test' }),
    );
  });

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
