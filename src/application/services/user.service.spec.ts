import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { UserService } from './user.service';

describe('UserService tenant isolation', () => {
  it('queries a user by id and company in one repository operation', async () => {
    const users = {
      findById: jest.fn(),
      findByIdAndCompanyId: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<IUserRepository>;
    const appointments = {} as jest.Mocked<IAppointmentRepository>;
    const service = new UserService(users, appointments);

    await expect(service.getUser('user-b', 'company-a')).resolves.toBeNull();
    expect(users.findByIdAndCompanyId).toHaveBeenCalledWith(
      'user-b',
      'company-a',
    );
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('fails closed when tenant context is missing', async () => {
    const users = {
      findByIdAndCompanyId: jest.fn(),
    } as unknown as jest.Mocked<IUserRepository>;
    const service = new UserService(
      users,
      {} as jest.Mocked<IAppointmentRepository>,
    );

    await expect(service.getUser('user-a', '')).resolves.toBeNull();
    expect(users.findByIdAndCompanyId).not.toHaveBeenCalled();
  });
});
