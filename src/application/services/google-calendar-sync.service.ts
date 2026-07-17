import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import {
  CalendarSyncOperation,
  CalendarSyncStatus,
} from '@domain/enums/calendar-sync-status.enum';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import type { Appointment } from '@domain/models/appointment.model';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '@domain/ports/appointment.repository.interface';
import {
  GOOGLE_CALENDAR_PROVIDER,
  type GoogleCalendarCredentialsResult,
  type IGoogleCalendarProvider,
} from '@domain/ports/google-calendar.provider.interface';
import {
  GOOGLE_INTEGRATION_REPOSITORY,
  type IGoogleIntegrationRepository,
} from '@domain/ports/google-integration.repository.interface';
import {
  TOKEN_CIPHER,
  type ITokenCipher,
} from '@domain/ports/token-cipher.interface';

const SYNC_INTERVAL_MS = 15_000;
const SYNC_BATCH_SIZE = 25;
const MAX_RETRY_DELAY_MS = 60 * 60 * 1000;

@Injectable()
export class GoogleCalendarSyncService implements OnModuleInit {
  private readonly logger = new Logger(GoogleCalendarSyncService.name);
  private readonly timeZone: string;
  private readonly inFlight = new Set<string>();
  private queueRunning = false;

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointments: IAppointmentRepository,
    @Inject(GOOGLE_INTEGRATION_REPOSITORY)
    private readonly integrations: IGoogleIntegrationRepository,
    @Inject(GOOGLE_CALENDAR_PROVIDER)
    private readonly calendar: IGoogleCalendarProvider,
    @Inject(TOKEN_CIPHER)
    private readonly cipher: ITokenCipher,
    config: ConfigService,
  ) {
    this.timeZone = config.get<string>(
      'GOOGLE_CALENDAR_TIME_ZONE',
      'America/Lima',
    );
  }

  async onModuleInit(): Promise<void> {
    try {
      const appointmentIds =
        await this.appointments.scheduleUnsyncedForGoogleUsers();
      for (const appointmentId of appointmentIds) this.trigger(appointmentId);
    } catch (error) {
      this.logger.warn(
        'Could not schedule existing appointments for Google Calendar sync',
        error,
      );
    }
  }

  trigger(appointmentId: string): void {
    void this.processAppointment(appointmentId).catch((error: unknown) => {
      this.logger.error(
        `Unexpected calendar sync failure for appointment ${appointmentId}`,
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  @Interval(SYNC_INTERVAL_MS)
  async processQueue(): Promise<void> {
    if (this.queueRunning) return;
    this.queueRunning = true;
    try {
      const pending = await this.appointments.findPendingCalendarSync(
        new Date(),
        SYNC_BATCH_SIZE,
      );
      for (const appointment of pending) {
        await this.processAppointment(appointment.id);
      }
    } finally {
      this.queueRunning = false;
    }
  }

  async processAppointment(appointmentId: string): Promise<void> {
    if (this.inFlight.has(appointmentId)) return;
    this.inFlight.add(appointmentId);
    try {
      const appointment =
        await this.appointments.findByIdForCalendarSync(appointmentId);
      if (
        !appointment ||
        !appointment.calendarSyncOperation ||
        ![CalendarSyncStatus.PENDING, CalendarSyncStatus.FAILED].includes(
          appointment.calendarSyncStatus,
        )
      ) {
        return;
      }

      const integration = await this.integrations.findByUserId(
        appointment.userId,
      );
      if (!integration?.refreshTokenEncrypted) {
        if (
          appointment.deletedAt &&
          appointment.calendarSyncOperation === CalendarSyncOperation.DELETE
        ) {
          await this.appointments.hardDelete(appointment.id);
          return;
        }
        await this.appointments.update(appointment.id, {
          calendarSyncStatus: CalendarSyncStatus.NOT_SYNCED,
          calendarSyncOperation: null,
          calendarSyncError: null,
          calendarSyncAttempts: 0,
          calendarSyncNextAttemptAt: null,
        });
        return;
      }

      const context = `google:${appointment.userId}`;
      const credentials = {
        accessToken: this.cipher.decrypt(
          integration.accessTokenEncrypted,
          context,
        ),
        refreshToken: this.cipher.decrypt(
          integration.refreshTokenEncrypted,
          context,
        ),
        expiryDate: integration.expiresAt?.getTime(),
      };
      const calendarId = appointment.externalCalendarId || 'primary';

      if (
        appointment.calendarSyncOperation === CalendarSyncOperation.DELETE ||
        appointment.status === AppointmentStatus.CANCELLED ||
        appointment.deletedAt
      ) {
        const refreshed = appointment.externalEventId
          ? await this.calendar.deleteEvent(
              credentials,
              calendarId,
              appointment.externalEventId,
            )
          : credentials;
        await this.persistRefreshedTokens(
          appointment.userId,
          context,
          refreshed,
        );
        if (appointment.deletedAt) {
          await this.appointments.hardDelete(appointment.id);
          return;
        }
        await this.appointments.update(appointment.id, {
          externalEventId: null,
          externalCalendarId: null,
          calendarSyncStatus: CalendarSyncStatus.SYNCED,
          calendarSyncOperation: null,
          calendarSyncError: null,
          calendarSyncAttempts: 0,
          calendarSyncNextAttemptAt: null,
          calendarSyncedAt: new Date(),
        });
        return;
      }

      const event = {
        appointmentId: appointment.id,
        title: appointment.title,
        description: appointment.description,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        timeZone: this.timeZone,
      };
      let result = appointment.externalEventId
        ? await this.calendar.updateEvent(
            credentials,
            calendarId,
            appointment.externalEventId,
            event,
          )
        : null;
      if (!result) {
        result = await this.calendar.createEvent(
          credentials,
          calendarId,
          event,
        );
      }
      await this.persistRefreshedTokens(
        appointment.userId,
        context,
        result.credentials,
      );
      await this.appointments.update(appointment.id, {
        externalEventId: result.eventId,
        externalCalendarId: calendarId,
        calendarSyncStatus: CalendarSyncStatus.SYNCED,
        calendarSyncOperation: null,
        calendarSyncError: null,
        calendarSyncAttempts: 0,
        calendarSyncNextAttemptAt: null,
        calendarSyncedAt: new Date(),
      });
    } catch (error) {
      await this.markFailed(appointmentId, error);
    } finally {
      this.inFlight.delete(appointmentId);
    }
  }

  private async persistRefreshedTokens(
    userId: string,
    context: string,
    credentials: GoogleCalendarCredentialsResult,
  ): Promise<void> {
    await this.integrations.updateTokens(userId, {
      accessTokenEncrypted: this.cipher.encrypt(
        credentials.accessToken,
        context,
      ),
      refreshTokenEncrypted: credentials.refreshToken
        ? this.cipher.encrypt(credentials.refreshToken, context)
        : undefined,
      expiresAt: credentials.expiryDate
        ? new Date(credentials.expiryDate)
        : undefined,
    });
  }

  private async markFailed(
    appointmentId: string,
    error: unknown,
  ): Promise<void> {
    const appointment =
      await this.appointments.findByIdForCalendarSync(appointmentId);
    if (!appointment) return;
    const attempts = (appointment.calendarSyncAttempts || 0) + 1;
    const retryDelay = Math.min(
      30_000 * 2 ** Math.min(attempts - 1, 7),
      MAX_RETRY_DELAY_MS,
    );
    const message = this.safeErrorMessage(error);
    this.logger.warn(
      `Google Calendar sync failed for appointment ${appointmentId}: ${message}`,
    );
    await this.appointments.update(appointmentId, {
      calendarSyncStatus: CalendarSyncStatus.FAILED,
      calendarSyncError: message,
      calendarSyncAttempts: attempts,
      calendarSyncNextAttemptAt: new Date(Date.now() + retryDelay),
    });
  }

  private safeErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (/invalid_grant|unauthorized|revoked/i.test(message)) {
      return 'La autorización de Google expiró. Vuelve a vincular la cuenta.';
    }
    return `No se pudo sincronizar con Google Calendar: ${message}`.slice(
      0,
      500,
    );
  }
}
