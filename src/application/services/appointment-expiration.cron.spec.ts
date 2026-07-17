import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { AppointmentExpirationCron } from './appointment-expiration.cron';

describe('AppointmentExpirationCron', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('expires scheduled appointments 24 hours after their end time', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-17T16:00:00.000Z'));
    const appointmentRepository = {
      expireScheduledBefore: jest.fn().mockResolvedValue(2),
    } as unknown as jest.Mocked<IAppointmentRepository>;
    const cron = new AppointmentExpirationCron(appointmentRepository);

    await expect(cron.expireOverdueAppointments()).resolves.toBe(2);
    expect(appointmentRepository.expireScheduledBefore).toHaveBeenCalledWith(
      new Date('2026-07-16T16:00:00.000Z'),
    );
  });

  it('checks overdue appointments when the module starts', async () => {
    const appointmentRepository = {
      expireScheduledBefore: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<IAppointmentRepository>;
    const cron = new AppointmentExpirationCron(appointmentRepository);

    await cron.onModuleInit();

    expect(appointmentRepository.expireScheduledBefore).toHaveBeenCalledTimes(
      1,
    );
  });
});
