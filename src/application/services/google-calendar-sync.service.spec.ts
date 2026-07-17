import { ConfigService } from '@nestjs/config';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import {
  CalendarSyncOperation,
  CalendarSyncStatus,
} from '@domain/enums/calendar-sync-status.enum';
import { Appointment } from '@domain/models/appointment.model';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import type { IGoogleCalendarProvider } from '@domain/ports/google-calendar.provider.interface';
import type { IGoogleIntegrationRepository } from '@domain/ports/google-integration.repository.interface';
import type { ITokenCipher } from '@domain/ports/token-cipher.interface';
import { GoogleCalendarSyncService } from './google-calendar-sync.service';

describe('GoogleCalendarSyncService', () => {
  const appointment = new Appointment({
    id: 'appointment-1',
    companyId: 'company-1',
    clientId: 'client-1',
    userId: 'user-1',
    title: 'Consulta',
    description: 'Control mensual',
    startTime: new Date('2026-07-20T15:00:00.000Z'),
    endTime: new Date('2026-07-20T16:00:00.000Z'),
    status: AppointmentStatus.SCHEDULED,
    calendarSyncStatus: CalendarSyncStatus.PENDING,
    calendarSyncOperation: CalendarSyncOperation.UPSERT,
    calendarSyncAttempts: 0,
  });

  const setup = () => {
    const appointments = {
      findByIdForCalendarSync: jest.fn().mockResolvedValue(appointment),
      update: jest
        .fn()
        .mockImplementation(
          async (_id, data) => new Appointment({ ...appointment, ...data }),
        ),
      hardDelete: jest.fn().mockResolvedValue(undefined),
      findPendingCalendarSync: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<IAppointmentRepository>;
    const integrations = {
      findByUserId: jest.fn().mockResolvedValue({
        userId: appointment.userId,
        accessTokenEncrypted: 'encrypted-access',
        refreshTokenEncrypted: 'encrypted-refresh',
        expiresAt: new Date('2026-07-20T14:00:00.000Z'),
      }),
      updateTokens: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IGoogleIntegrationRepository>;
    const calendar = {
      createEvent: jest.fn().mockResolvedValue({
        eventId: 'google-event-1',
        credentials: {
          accessToken: 'new-access-token',
          expiryDate: Date.parse('2026-07-20T17:00:00.000Z'),
        },
      }),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
    } as unknown as jest.Mocked<IGoogleCalendarProvider>;
    const cipher = {
      decrypt: jest
        .fn()
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token'),
      encrypt: jest.fn((value: string) => `encrypted:${value}`),
    } as unknown as jest.Mocked<ITokenCipher>;
    const config = {
      get: jest.fn().mockReturnValue('America/Lima'),
    } as unknown as ConfigService;
    const service = new GoogleCalendarSyncService(
      appointments,
      integrations,
      calendar,
      cipher,
      config,
    );
    return { service, appointments, integrations, calendar, cipher };
  };

  it('creates a Google event and marks the appointment as synced', async () => {
    const { service, appointments, integrations, calendar } = setup();

    await service.processAppointment(appointment.id);

    expect(calendar.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: 'refresh-token' }),
      'primary',
      expect.objectContaining({
        appointmentId: appointment.id,
        timeZone: 'America/Lima',
      }),
    );
    expect(integrations.updateTokens).toHaveBeenCalledWith(
      appointment.userId,
      expect.objectContaining({
        accessTokenEncrypted: 'encrypted:new-access-token',
      }),
    );
    expect(appointments.update).toHaveBeenCalledWith(
      appointment.id,
      expect.objectContaining({
        externalEventId: 'google-event-1',
        externalCalendarId: 'primary',
        calendarSyncStatus: CalendarSyncStatus.SYNCED,
        calendarSyncOperation: null,
      }),
    );
  });

  it('persists a retry with exponential backoff after a Google failure', async () => {
    const { service, appointments, calendar } = setup();
    calendar.createEvent.mockRejectedValue(new Error('temporary outage'));

    await service.processAppointment(appointment.id);

    expect(appointments.update).toHaveBeenLastCalledWith(
      appointment.id,
      expect.objectContaining({
        calendarSyncStatus: CalendarSyncStatus.FAILED,
        calendarSyncAttempts: 1,
        calendarSyncNextAttemptAt: expect.any(Date),
      }),
    );
  });
});
