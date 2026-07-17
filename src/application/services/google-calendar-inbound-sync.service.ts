import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression, Interval } from '@nestjs/schedule';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import { CalendarSyncStatus } from '@domain/enums/calendar-sync-status.enum';
import type { GoogleIntegration } from '@domain/models/google-integration.model';
import {
  APPOINTMENT_REPOSITORY,
  type IAppointmentRepository,
} from '@domain/ports/appointment.repository.interface';
import {
  GOOGLE_CALENDAR_PROVIDER,
  type GoogleCalendarCredentials,
  type GoogleCalendarCredentialsResult,
  type GoogleCalendarEventChange,
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
import { AppointmentAvailabilityService } from './appointment-availability.service';
import { AppointmentScheduleConflictService } from './appointment-schedule-conflict.service';

const LOCAL_POLL_INTERVAL_MS = 60_000;
const CHANNEL_TTL_SECONDS = 7 * 24 * 60 * 60;
const CHANNEL_RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const EXPIRATION_DELAY_MS = 24 * 60 * 60 * 1000;

export interface GoogleCalendarNotification {
  channelId?: string;
  resourceId?: string;
  resourceState?: string;
  token?: string;
}

@Injectable()
export class GoogleCalendarInboundSyncService implements OnModuleInit {
  private readonly logger = new Logger(GoogleCalendarInboundSyncService.name);
  private readonly webhookUrl: string;
  private readonly syncInFlight = new Set<string>();
  private readonly setupInFlight = new Set<string>();

  constructor(
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointments: IAppointmentRepository,
    @Inject(GOOGLE_INTEGRATION_REPOSITORY)
    private readonly integrations: IGoogleIntegrationRepository,
    @Inject(GOOGLE_CALENDAR_PROVIDER)
    private readonly calendar: IGoogleCalendarProvider,
    @Inject(TOKEN_CIPHER)
    private readonly cipher: ITokenCipher,
    private readonly appointmentAvailability: AppointmentAvailabilityService,
    private readonly scheduleConflicts: AppointmentScheduleConflictService,
    config: ConfigService,
  ) {
    this.webhookUrl = config
      .get<string>('GOOGLE_CALENDAR_WEBHOOK_URL', '')
      .trim();
  }

  async onModuleInit(): Promise<void> {
    await this.maintainConnections();
    if (!this.webhookUrl) {
      this.logger.log(
        'Google Calendar inbound sync is using local polling; configure GOOGLE_CALENDAR_WEBHOOK_URL for push notifications',
      );
    }
  }

  triggerSetup(userId: string): void {
    void this.ensureForUser(userId).catch((error: unknown) => {
      this.logger.warn(
        `Could not initialize inbound Google Calendar sync for user ${userId}: ${this.errorMessage(error)}`,
      );
    });
  }

  async ensureForUser(userId: string): Promise<void> {
    if (this.setupInFlight.has(userId)) return;
    this.setupInFlight.add(userId);
    try {
      let integration = await this.integrations.findByUserId(userId);
      if (!integration?.refreshTokenEncrypted) return;
      if (this.webhookUrl && this.channelNeedsRenewal(integration)) {
        await this.createReplacementChannel(integration);
        integration = await this.integrations.findByUserId(userId);
        if (!integration) return;
      }
      if (!integration.calendarSyncToken) await this.pullChanges(userId);
    } finally {
      this.setupInFlight.delete(userId);
    }
  }

  async stopForUser(userId: string): Promise<void> {
    const integration = await this.integrations.findByUserId(userId);
    if (!integration?.webhookChannelId || !integration.webhookResourceId) {
      return;
    }
    try {
      const credentials = this.credentials(integration);
      const refreshed = await this.calendar.stopChannel(
        credentials,
        integration.webhookChannelId,
        integration.webhookResourceId,
      );
      await this.persistRefreshedTokens(integration, refreshed);
    } catch (error) {
      this.logger.warn(
        `Could not stop Google Calendar channel for user ${userId}: ${this.errorMessage(error)}`,
      );
    }
  }

  async handleNotification(
    notification: GoogleCalendarNotification,
  ): Promise<boolean> {
    if (
      !notification.channelId ||
      !notification.resourceId ||
      !notification.token ||
      !['sync', 'exists'].includes(notification.resourceState ?? '')
    ) {
      return false;
    }
    const integration = await this.integrations.findByWebhookChannelId(
      notification.channelId,
    );
    if (
      !integration ||
      integration.webhookResourceId !== notification.resourceId ||
      !integration.webhookTokenHash ||
      !this.matchesHash(notification.token, integration.webhookTokenHash)
    ) {
      return false;
    }
    await this.pullChanges(integration.userId);
    return true;
  }

  @Interval(LOCAL_POLL_INTERVAL_MS)
  async pollWithoutWebhook(): Promise<void> {
    if (this.webhookUrl) return;
    await this.syncAllConnections();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async maintainConnections(): Promise<void> {
    const integrations = await this.integrations.findAll();
    for (const integration of integrations) {
      try {
        await this.ensureForUser(integration.userId);
      } catch (error) {
        await this.recordError(integration.userId, error);
      }
    }
  }

  async pullChanges(userId: string): Promise<void> {
    if (this.syncInFlight.has(userId)) return;
    this.syncInFlight.add(userId);
    try {
      const integration = await this.integrations.findByUserId(userId);
      if (!integration?.refreshTokenEncrypted) return;
      const result = await this.calendar.listEventChanges(
        this.credentials(integration),
        integration.calendarId || 'primary',
        integration.calendarSyncToken,
      );
      const seenEventIds = new Set<string>();
      for (const event of result.events) {
        seenEventIds.add(event.eventId);
        await this.applyEventChange(integration, event);
      }
      if (result.fullSync) {
        await this.reconcileMissingEvents(integration, seenEventIds);
        await this.scheduleConflicts.resolveMissingGoogleEvents(
          integration.userId,
          seenEventIds,
        );
      }
      await this.persistRefreshedTokens(integration, result.credentials);
      await this.integrations.updateCalendarSync(userId, {
        calendarSyncToken: result.nextSyncToken,
        inboundSyncedAt: new Date(),
        inboundSyncError: null,
      });
    } catch (error) {
      await this.recordError(userId, error);
    } finally {
      this.syncInFlight.delete(userId);
    }
  }

  private async syncAllConnections(): Promise<void> {
    const integrations = await this.integrations.findAll();
    for (const integration of integrations) {
      await this.pullChanges(integration.userId);
    }
  }

  private async applyEventChange(
    integration: GoogleIntegration,
    event: GoogleCalendarEventChange,
  ): Promise<void> {
    const appointment = await this.appointments.findByExternalEventId(
      integration.userId,
      integration.calendarId || 'primary',
      event.eventId,
    );
    if (!appointment) {
      await this.applyUnlinkedGoogleEvent(integration.userId, event);
      return;
    }
    await this.scheduleConflicts.resolveGoogleEvent(
      integration.userId,
      event.eventId,
    );
    if (appointment.status === AppointmentStatus.COMPLETED) {
      return;
    }
    if (
      event.updatedAt &&
      appointment.calendarSyncedAt &&
      event.updatedAt.getTime() <= appointment.calendarSyncedAt.getTime()
    ) {
      return;
    }
    if (event.status === 'cancelled') {
      await this.appointments.update(appointment.id, {
        status: AppointmentStatus.CANCELLED,
        calendarSyncStatus: CalendarSyncStatus.SYNCED,
        calendarSyncOperation: null,
        calendarSyncError: null,
        calendarSyncAttempts: 0,
        calendarSyncNextAttemptAt: null,
        calendarSyncedAt: event.updatedAt ?? new Date(),
      });
      await this.scheduleConflicts.resolveAppointment(appointment.id);
      return;
    }
    if (
      !event.startTime ||
      !event.endTime ||
      Number.isNaN(event.startTime.getTime()) ||
      Number.isNaN(event.endTime.getTime()) ||
      event.endTime.getTime() <= event.startTime.getTime()
    ) {
      this.logger.warn(
        `Ignoring unsupported Google Calendar timing for event ${event.eventId}`,
      );
      return;
    }
    const status =
      event.endTime.getTime() <= Date.now() - EXPIRATION_DELAY_MS
        ? AppointmentStatus.EXPIRED
        : AppointmentStatus.SCHEDULED;
    if (status === AppointmentStatus.SCHEDULED) {
      const conflicts = await this.appointmentAvailability.findLocalConflicts(
        appointment.userId,
        event.startTime,
        event.endTime,
        appointment.id,
      );
      if (conflicts.length > 0) {
        await this.appointments.update(appointment.id, {
          calendarSyncStatus: CalendarSyncStatus.FAILED,
          calendarSyncOperation: null,
          calendarSyncError:
            'El horario cambiado en Google se superpone con otra cita programada en Agenda.',
          calendarSyncAttempts: 0,
          calendarSyncNextAttemptAt: null,
          calendarSyncedAt: event.updatedAt ?? new Date(),
        });
        return;
      }
    }
    await this.appointments.update(appointment.id, {
      title: event.title ?? appointment.title,
      description: event.description ?? '',
      startTime: event.startTime,
      endTime: event.endTime,
      status,
      calendarSyncStatus: CalendarSyncStatus.SYNCED,
      calendarSyncOperation: null,
      calendarSyncError: null,
      calendarSyncAttempts: 0,
      calendarSyncNextAttemptAt: null,
      calendarSyncedAt: event.updatedAt ?? new Date(),
    });
    await this.scheduleConflicts.resolveAppointment(appointment.id);
  }

  private async applyUnlinkedGoogleEvent(
    userId: string,
    event: GoogleCalendarEventChange,
  ): Promise<void> {
    if (
      event.status === 'cancelled' ||
      event.isBusy === false ||
      !event.startTime ||
      !event.endTime ||
      Number.isNaN(event.startTime.getTime()) ||
      Number.isNaN(event.endTime.getTime()) ||
      event.endTime.getTime() <= event.startTime.getTime()
    ) {
      await this.scheduleConflicts.resolveGoogleEvent(userId, event.eventId);
      return;
    }

    const appointments = await this.appointmentAvailability.findLocalConflicts(
      userId,
      event.startTime,
      event.endTime,
    );
    await this.scheduleConflicts.recordGoogleEvent({
      userId,
      externalEventId: event.eventId,
      startTime: event.startTime,
      endTime: event.endTime,
      appointmentIds: appointments.flatMap((conflict) =>
        conflict.appointmentId ? [conflict.appointmentId] : [],
      ),
    });
  }

  private async reconcileMissingEvents(
    integration: GoogleIntegration,
    seenEventIds: Set<string>,
  ): Promise<void> {
    const linked = await this.appointments.findAllLinkedByUserCalendar(
      integration.userId,
      integration.calendarId || 'primary',
    );
    for (const appointment of linked) {
      if (
        appointment.externalEventId &&
        !seenEventIds.has(appointment.externalEventId) &&
        appointment.status !== AppointmentStatus.COMPLETED
      ) {
        await this.appointments.update(appointment.id, {
          status: AppointmentStatus.CANCELLED,
          calendarSyncStatus: CalendarSyncStatus.SYNCED,
          calendarSyncOperation: null,
          calendarSyncError: null,
          calendarSyncAttempts: 0,
          calendarSyncNextAttemptAt: null,
          calendarSyncedAt: new Date(),
        });
      }
    }
  }

  private async createReplacementChannel(
    integration: GoogleIntegration,
  ): Promise<void> {
    const previousChannelId = integration.webhookChannelId;
    const previousResourceId = integration.webhookResourceId;
    const token = randomBytes(32).toString('base64url');
    const result = await this.calendar.watchEvents(
      this.credentials(integration),
      integration.calendarId || 'primary',
      {
        channelId: randomUUID(),
        address: this.webhookUrl,
        token,
        ttlSeconds: CHANNEL_TTL_SECONDS,
      },
    );
    await this.persistRefreshedTokens(integration, result.credentials);
    await this.integrations.updateCalendarSync(integration.userId, {
      webhookChannelId: result.channelId,
      webhookResourceId: result.resourceId,
      webhookTokenHash: this.hash(token),
      webhookExpiresAt: result.expiresAt ?? null,
      inboundSyncError: null,
    });
    if (previousChannelId && previousResourceId) {
      try {
        const stopCredentials: GoogleCalendarCredentials = {
          accessToken: result.credentials.accessToken,
          refreshToken:
            result.credentials.refreshToken ??
            this.credentials(integration).refreshToken,
          expiryDate: result.credentials.expiryDate,
        };
        const refreshed = await this.calendar.stopChannel(
          stopCredentials,
          previousChannelId,
          previousResourceId,
        );
        await this.persistRefreshedTokens(integration, refreshed);
      } catch (error) {
        this.logger.warn(
          `Old Google Calendar channel ${previousChannelId} will expire naturally: ${this.errorMessage(error)}`,
        );
      }
    }
  }

  private channelNeedsRenewal(integration: GoogleIntegration): boolean {
    return Boolean(
      !integration.webhookChannelId ||
      !integration.webhookResourceId ||
      !integration.webhookTokenHash ||
      !integration.webhookExpiresAt ||
      integration.webhookExpiresAt.getTime() <=
        Date.now() + CHANNEL_RENEWAL_WINDOW_MS,
    );
  }

  private credentials(
    integration: GoogleIntegration,
  ): GoogleCalendarCredentials {
    if (!integration.refreshTokenEncrypted) {
      throw new Error('Google Calendar refresh token is unavailable');
    }
    const context = this.tokenContext(integration.userId);
    return {
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
  }

  private async persistRefreshedTokens(
    integration: GoogleIntegration,
    credentials: GoogleCalendarCredentialsResult,
  ): Promise<void> {
    const context = this.tokenContext(integration.userId);
    await this.integrations.updateTokens(integration.userId, {
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

  private async recordError(userId: string, error: unknown): Promise<void> {
    const message = this.errorMessage(error).slice(0, 500);
    this.logger.warn(
      `Google Calendar inbound sync failed for user ${userId}: ${message}`,
    );
    await this.integrations.updateCalendarSync(userId, {
      inboundSyncError: message,
    });
  }

  private matchesHash(value: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hash(value), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private tokenContext(userId: string): string {
    return `google:${userId}`;
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}
