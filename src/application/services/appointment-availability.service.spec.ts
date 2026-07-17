import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { Appointment } from '@domain/models/appointment.model';
import { AppointmentAvailabilitySource } from '@domain/models/appointment-availability.model';
import { AppointmentAvailabilityService } from './appointment-availability.service';

describe('AppointmentAvailabilityService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-17T17:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createService = () => {
    const appointments = {
      findById: jest.fn(),
      findOverlappingScheduled: jest.fn().mockResolvedValue([]),
    };
    const users = {
      findById: jest.fn().mockResolvedValue({
        id: 'user-1',
        companyId: 'company-1',
        integrationProvider: 'none',
        syncCalendar: false,
      }),
    };
    const integrations = {
      findByUserId: jest.fn(),
      updateTokens: jest.fn(),
    };
    const calendar = { listBusyIntervals: jest.fn() };
    const cipher = {
      decrypt: jest.fn((value: string) => value),
      encrypt: jest.fn((value: string) => `encrypted:${value}`),
    };
    const config = {
      get: jest.fn().mockReturnValue('America/Lima'),
    } as unknown as ConfigService;
    const service = new AppointmentAvailabilityService(
      appointments as never,
      users as never,
      integrations as never,
      calendar as never,
      cipher as never,
      config,
    );
    return { service, appointments, users, integrations, calendar, cipher };
  };

  const input = {
    userId: 'user-1',
    companyId: 'company-1',
    startTime: new Date('2026-07-18T15:00:00.000Z'),
    endTime: new Date('2026-07-18T16:00:00.000Z'),
  };

  it('returns an Agenda conflict without calling Google', async () => {
    const { service, appointments, calendar } = createService();
    appointments.findOverlappingScheduled.mockResolvedValue([
      new Appointment({
        id: 'appointment-2',
        startTime: new Date('2026-07-18T15:30:00.000Z'),
        endTime: new Date('2026-07-18T16:30:00.000Z'),
      }),
    ]);

    const result = await service.checkAvailability(input);

    expect(result.available).toBe(false);
    expect(result.externalCalendarChecked).toBe(false);
    expect(result.conflicts).toEqual([
      expect.objectContaining({
        source: AppointmentAvailabilitySource.AGENDA,
        appointmentId: 'appointment-2',
      }),
    ]);
    expect(calendar.listBusyIntervals).not.toHaveBeenCalled();
  });

  it('checks Google and excludes the event belonging to the edited appointment', async () => {
    const { service, appointments, users, integrations, calendar } =
      createService();
    users.findById.mockResolvedValue({
      id: 'user-1',
      companyId: 'company-1',
      googleId: 'google-1',
      integrationProvider: 'google',
      syncCalendar: true,
    });
    appointments.findById.mockResolvedValue(
      new Appointment({
        id: 'appointment-1',
        userId: 'user-1',
        companyId: 'company-1',
        externalEventId: 'event-1',
      }),
    );
    integrations.findByUserId.mockResolvedValue({
      userId: 'user-1',
      accessTokenEncrypted: 'access-token',
      refreshTokenEncrypted: 'refresh-token',
      calendarId: 'primary',
    });
    calendar.listBusyIntervals.mockResolvedValue({
      intervals: [],
      credentials: { accessToken: 'new-access-token' },
    });

    const result = await service.checkAvailability({
      ...input,
      excludeAppointmentId: 'appointment-1',
    });

    expect(result).toEqual({
      available: true,
      externalCalendarChecked: true,
      conflicts: [],
    });
    expect(calendar.listBusyIntervals).toHaveBeenCalledWith(
      expect.any(Object),
      'primary',
      expect.objectContaining({ excludeEventId: 'event-1' }),
    );
    expect(integrations.updateTokens).toHaveBeenCalled();
  });

  it('reports Google busy time without exposing event identifiers', async () => {
    const { service, users, integrations, calendar } = createService();
    users.findById.mockResolvedValue({
      id: 'user-1',
      companyId: 'company-1',
      googleId: 'google-1',
      integrationProvider: 'google',
      syncCalendar: true,
    });
    integrations.findByUserId.mockResolvedValue({
      userId: 'user-1',
      accessTokenEncrypted: 'access-token',
      refreshTokenEncrypted: 'refresh-token',
      calendarId: 'primary',
    });
    calendar.listBusyIntervals.mockResolvedValue({
      intervals: [
        {
          eventId: 'private-google-event',
          startTime: input.startTime,
          endTime: input.endTime,
        },
      ],
      credentials: { accessToken: 'access-token' },
    });

    const result = await service.checkAvailability(input);

    expect(result.available).toBe(false);
    expect(result.conflicts[0]).toEqual({
      source: AppointmentAvailabilitySource.GOOGLE,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    expect(result.conflicts[0]).not.toHaveProperty('eventId');
  });

  it('fails closed when Google availability cannot be verified', async () => {
    const { service, users, integrations, calendar } = createService();
    users.findById.mockResolvedValue({
      id: 'user-1',
      companyId: 'company-1',
      googleId: 'google-1',
      integrationProvider: 'google',
      syncCalendar: true,
    });
    integrations.findByUserId.mockResolvedValue({
      userId: 'user-1',
      accessTokenEncrypted: 'access-token',
      refreshTokenEncrypted: 'refresh-token',
      calendarId: 'primary',
    });
    calendar.listBusyIntervals.mockRejectedValue(new Error('temporary outage'));

    await expect(service.checkAvailability(input)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
