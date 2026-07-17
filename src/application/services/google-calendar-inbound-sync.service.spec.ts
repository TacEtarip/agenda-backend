import { createHash } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import { CalendarSyncStatus } from '@domain/enums/calendar-sync-status.enum';
import { Appointment } from '@domain/models/appointment.model';
import { GoogleIntegration } from '@domain/models/google-integration.model';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import type { IGoogleCalendarProvider } from '@domain/ports/google-calendar.provider.interface';
import type { IGoogleIntegrationRepository } from '@domain/ports/google-integration.repository.interface';
import type { ITokenCipher } from '@domain/ports/token-cipher.interface';
import { GoogleCalendarInboundSyncService } from './google-calendar-inbound-sync.service';

describe('GoogleCalendarInboundSyncService', () => {
  const webhookToken = 'webhook-secret';
  const integration = new GoogleIntegration({
    id: 'integration-1',
    userId: 'user-1',
    companyId: 'company-1',
    accessTokenEncrypted: 'encrypted-access',
    refreshTokenEncrypted: 'encrypted-refresh',
    calendarId: 'primary',
    calendarSyncToken: 'sync-token-1',
    webhookChannelId: 'channel-1',
    webhookResourceId: 'resource-1',
    webhookTokenHash: createHash('sha256').update(webhookToken).digest('hex'),
  });
  const appointment = new Appointment({
    id: 'appointment-1',
    userId: integration.userId,
    companyId: integration.companyId,
    title: 'Consulta original',
    description: 'Original',
    startTime: new Date('2026-07-20T15:00:00.000Z'),
    endTime: new Date('2026-07-20T16:00:00.000Z'),
    status: AppointmentStatus.SCHEDULED,
    externalEventId: 'event-1',
    externalCalendarId: 'primary',
    calendarSyncStatus: CalendarSyncStatus.SYNCED,
    calendarSyncedAt: new Date('2026-07-17T15:00:00.000Z'),
  });

  const setup = () => {
    const appointments = {
      findByExternalEventId: jest.fn().mockResolvedValue(appointment),
      findAllLinkedByUserCalendar: jest.fn().mockResolvedValue([appointment]),
      update: jest.fn().mockResolvedValue(appointment),
    } as unknown as jest.Mocked<IAppointmentRepository>;
    const integrations = {
      findByUserId: jest.fn().mockResolvedValue(integration),
      findByWebhookChannelId: jest.fn().mockResolvedValue(integration),
      findAll: jest.fn().mockResolvedValue([integration]),
      updateTokens: jest.fn().mockResolvedValue(undefined),
      updateCalendarSync: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IGoogleIntegrationRepository>;
    const calendar = {
      listEventChanges: jest.fn().mockResolvedValue({
        events: [
          {
            eventId: 'event-1',
            status: 'confirmed',
            title: 'Consulta modificada en Google',
            description: 'Actualizada',
            startTime: new Date('2026-07-21T15:00:00.000Z'),
            endTime: new Date('2026-07-21T16:00:00.000Z'),
            updatedAt: new Date('2026-07-17T16:00:00.000Z'),
          },
        ],
        nextSyncToken: 'sync-token-2',
        fullSync: false,
        credentials: { accessToken: 'new-access-token' },
      }),
    } as unknown as jest.Mocked<IGoogleCalendarProvider>;
    const cipher = {
      decrypt: jest.fn((value: string) => value.replace('encrypted-', '')),
      encrypt: jest.fn((value: string) => `encrypted-${value}`),
    } as unknown as jest.Mocked<ITokenCipher>;
    const config = {
      get: jest.fn().mockReturnValue(''),
    } as unknown as ConfigService;
    const appointmentAvailability = {
      findLocalConflicts: jest.fn().mockResolvedValue([]),
    };
    const scheduleConflicts = {
      recordGoogleEvent: jest.fn().mockResolvedValue(undefined),
      resolveGoogleEvent: jest.fn().mockResolvedValue(undefined),
      resolveAppointment: jest.fn().mockResolvedValue(undefined),
      resolveMissingGoogleEvents: jest.fn().mockResolvedValue(undefined),
    };
    const service = new GoogleCalendarInboundSyncService(
      appointments,
      integrations,
      calendar,
      cipher,
      appointmentAvailability as never,
      scheduleConflicts as never,
      config,
    );
    return {
      service,
      appointments,
      integrations,
      calendar,
      appointmentAvailability,
      scheduleConflicts,
    };
  };

  it('applies a Google event update without scheduling an outbound write', async () => {
    const { service, appointments, integrations } = setup();

    await service.pullChanges(integration.userId);

    expect(appointments.update).toHaveBeenCalledWith(
      appointment.id,
      expect.objectContaining({
        title: 'Consulta modificada en Google',
        startTime: new Date('2026-07-21T15:00:00.000Z'),
        status: AppointmentStatus.SCHEDULED,
        calendarSyncStatus: CalendarSyncStatus.SYNCED,
        calendarSyncOperation: null,
      }),
    );
    expect(integrations.updateCalendarSync).toHaveBeenCalledWith(
      integration.userId,
      expect.objectContaining({
        calendarSyncToken: 'sync-token-2',
        inboundSyncError: null,
      }),
    );
  });

  it('marks the linked appointment as cancelled when Google deletes it', async () => {
    const { service, appointments, calendar } = setup();
    calendar.listEventChanges.mockResolvedValue({
      events: [
        {
          eventId: 'event-1',
          status: 'cancelled',
          updatedAt: new Date('2026-07-17T16:00:00.000Z'),
        },
      ],
      nextSyncToken: 'sync-token-2',
      fullSync: false,
      credentials: { accessToken: 'new-access-token' },
    });

    await service.pullChanges(integration.userId);

    expect(appointments.update).toHaveBeenCalledWith(
      appointment.id,
      expect.objectContaining({ status: AppointmentStatus.CANCELLED }),
    );
  });

  it('keeps the local time and marks a conflict when Google overlaps another appointment', async () => {
    const { service, appointments, appointmentAvailability } = setup();
    appointmentAvailability.findLocalConflicts.mockResolvedValue([
      {
        source: 'agenda',
        appointmentId: 'appointment-2',
        startTime: new Date('2026-07-21T15:30:00.000Z'),
        endTime: new Date('2026-07-21T16:30:00.000Z'),
      },
    ]);

    await service.pullChanges(integration.userId);

    expect(appointments.update).toHaveBeenCalledWith(
      appointment.id,
      expect.objectContaining({
        calendarSyncStatus: CalendarSyncStatus.FAILED,
        calendarSyncError: expect.stringContaining('se superpone'),
      }),
    );
    expect(appointments.update).not.toHaveBeenCalledWith(
      appointment.id,
      expect.objectContaining({
        startTime: new Date('2026-07-21T15:00:00.000Z'),
      }),
    );
  });

  it('ignores notifications with an invalid channel token', async () => {
    const { service, calendar } = setup();

    await expect(
      service.handleNotification({
        channelId: integration.webhookChannelId,
        resourceId: integration.webhookResourceId,
        resourceState: 'exists',
        token: 'forged-token',
      }),
    ).resolves.toBe(false);
    expect(calendar.listEventChanges).not.toHaveBeenCalled();
  });

  it('processes a valid Google push notification', async () => {
    const { service, calendar } = setup();

    await expect(
      service.handleNotification({
        channelId: integration.webhookChannelId,
        resourceId: integration.webhookResourceId,
        resourceState: 'exists',
        token: webhookToken,
      }),
    ).resolves.toBe(true);
    expect(calendar.listEventChanges).toHaveBeenCalled();
  });

  it('records a conflict when an unlinked busy Google event overlaps an appointment', async () => {
    const {
      service,
      appointments,
      calendar,
      appointmentAvailability,
      scheduleConflicts,
    } = setup();
    appointments.findByExternalEventId.mockResolvedValue(null);
    appointmentAvailability.findLocalConflicts.mockResolvedValue([
      {
        source: 'agenda',
        appointmentId: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      },
    ]);
    calendar.listEventChanges.mockResolvedValue({
      events: [
        {
          eventId: 'personal-event-1',
          status: 'confirmed',
          isBusy: true,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
        },
      ],
      nextSyncToken: 'sync-token-2',
      fullSync: false,
      credentials: { accessToken: 'new-access-token' },
    });

    await service.pullChanges(integration.userId);

    expect(scheduleConflicts.recordGoogleEvent).toHaveBeenCalledWith({
      userId: integration.userId,
      externalEventId: 'personal-event-1',
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      appointmentIds: [appointment.id],
    });
  });

  it('resolves a personal Google conflict when the event is deleted', async () => {
    const { service, appointments, calendar, scheduleConflicts } = setup();
    appointments.findByExternalEventId.mockResolvedValue(null);
    calendar.listEventChanges.mockResolvedValue({
      events: [{ eventId: 'personal-event-1', status: 'cancelled' }],
      nextSyncToken: 'sync-token-2',
      fullSync: false,
      credentials: { accessToken: 'new-access-token' },
    });

    await service.pullChanges(integration.userId);

    expect(scheduleConflicts.resolveGoogleEvent).toHaveBeenCalledWith(
      integration.userId,
      'personal-event-1',
    );
  });

  it('resolves conflicts for events absent from a full synchronization', async () => {
    const { service, calendar, scheduleConflicts } = setup();
    calendar.listEventChanges.mockResolvedValue({
      events: [],
      nextSyncToken: 'sync-token-2',
      fullSync: true,
      credentials: { accessToken: 'new-access-token' },
    });

    await service.pullChanges(integration.userId);

    expect(scheduleConflicts.resolveMissingGoogleEvents).toHaveBeenCalledWith(
      integration.userId,
      new Set<string>(),
    );
  });
});
