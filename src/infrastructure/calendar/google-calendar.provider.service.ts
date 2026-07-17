import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calendar_v3, google } from 'googleapis';
import {
  GoogleCalendarCredentials,
  GoogleCalendarCredentialsResult,
  GoogleCalendarAvailabilityInput,
  GoogleCalendarBusyResult,
  GoogleCalendarChangesResult,
  GoogleCalendarEventInput,
  GoogleCalendarEventResult,
  GoogleCalendarWatchInput,
  GoogleCalendarWatchResult,
  IGoogleCalendarProvider,
} from '@domain/ports/google-calendar.provider.interface';

@Injectable()
export class GoogleCalendarProviderService implements IGoogleCalendarProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(config: ConfigService) {
    this.clientId = config.get<string>('GOOGLE_CLIENT_ID', '');
    this.clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET', '');
    this.redirectUri = config.get<string>('GOOGLE_REDIRECT_URI', '');
  }

  async listBusyIntervals(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    input: GoogleCalendarAvailabilityInput,
  ): Promise<GoogleCalendarBusyResult> {
    const client = this.createClient(credentials);
    const api = google.calendar({ version: 'v3', auth: client });
    const intervals: GoogleCalendarBusyResult['intervals'] = [];
    let pageToken: string | undefined;

    do {
      const response = await api.events.list({
        calendarId,
        timeMin: input.startTime.toISOString(),
        timeMax: input.endTime.toISOString(),
        timeZone: input.timeZone,
        singleEvents: true,
        showDeleted: false,
        maxResults: 2500,
        pageToken,
      });

      for (const event of response.data.items ?? []) {
        if (
          !event.id ||
          event.id === input.excludeEventId ||
          event.status === 'cancelled' ||
          event.transparency === 'transparent' ||
          event.attendees?.some(
            (attendee) =>
              attendee.self && attendee.responseStatus === 'declined',
          )
        ) {
          continue;
        }

        const allDay = Boolean(event.start?.date && event.end?.date);
        const startTime = event.start?.dateTime
          ? new Date(event.start.dateTime)
          : allDay
            ? input.startTime
            : undefined;
        const endTime = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : allDay
            ? input.endTime
            : undefined;

        if (
          !startTime ||
          !endTime ||
          Number.isNaN(startTime.getTime()) ||
          Number.isNaN(endTime.getTime()) ||
          startTime >= input.endTime ||
          endTime <= input.startTime
        ) {
          continue;
        }

        intervals.push({ eventId: event.id, startTime, endTime });
      }

      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);

    return {
      intervals,
      credentials: this.currentCredentials(client),
    };
  }

  async createEvent(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    event: GoogleCalendarEventInput,
  ): Promise<GoogleCalendarEventResult> {
    const client = this.createClient(credentials);
    const response = await google
      .calendar({ version: 'v3', auth: client })
      .events.insert({
        calendarId,
        sendUpdates: 'none',
        requestBody: this.toGoogleEvent(event),
      });
    if (!response.data.id)
      throw new Error('Google Calendar did not return an event ID');
    return {
      eventId: response.data.id,
      credentials: this.currentCredentials(client),
    };
  }

  async updateEvent(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    eventId: string,
    event: GoogleCalendarEventInput,
  ): Promise<GoogleCalendarEventResult | null> {
    const client = this.createClient(credentials);
    try {
      const response = await google
        .calendar({ version: 'v3', auth: client })
        .events.update({
          calendarId,
          eventId,
          sendUpdates: 'none',
          requestBody: this.toGoogleEvent(event),
        });
      if (!response.data.id)
        throw new Error('Google Calendar did not return an event ID');
      return {
        eventId: response.data.id,
        credentials: this.currentCredentials(client),
      };
    } catch (error) {
      if (this.isMissingEvent(error)) return null;
      throw error;
    }
  }

  async deleteEvent(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    eventId: string,
  ): Promise<GoogleCalendarCredentialsResult> {
    const client = this.createClient(credentials);
    try {
      await google.calendar({ version: 'v3', auth: client }).events.delete({
        calendarId,
        eventId,
        sendUpdates: 'none',
      });
    } catch (error) {
      if (!this.isMissingEvent(error)) throw error;
    }
    return this.currentCredentials(client);
  }

  async listEventChanges(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    syncToken?: string,
  ): Promise<GoogleCalendarChangesResult> {
    const client = this.createClient(credentials);
    const api = google.calendar({ version: 'v3', auth: client });
    const events: GoogleCalendarChangesResult['events'] = [];
    let pageToken: string | undefined;
    let nextSyncToken: string | undefined;

    try {
      do {
        const response = await api.events.list({
          calendarId,
          showDeleted: true,
          maxResults: 2500,
          pageToken,
          ...(syncToken ? { syncToken } : {}),
        });
        for (const event of response.data.items ?? []) {
          if (!event.id) continue;
          events.push({
            eventId: event.id,
            appointmentId:
              event.extendedProperties?.private?.tacEtaripAppointmentId,
            status: event.status ?? 'confirmed',
            title: event.summary ?? undefined,
            description: event.description ?? undefined,
            startTime: event.start?.dateTime
              ? new Date(event.start.dateTime)
              : undefined,
            endTime: event.end?.dateTime
              ? new Date(event.end.dateTime)
              : undefined,
            updatedAt: event.updated ? new Date(event.updated) : undefined,
            isBusy:
              event.transparency !== 'transparent' &&
              !event.attendees?.some(
                (attendee) =>
                  attendee.self && attendee.responseStatus === 'declined',
              ),
          });
        }
        pageToken = response.data.nextPageToken ?? undefined;
        nextSyncToken = response.data.nextSyncToken ?? nextSyncToken;
      } while (pageToken);
    } catch (error) {
      if (syncToken && this.isStatus(error, 410)) {
        const refreshed = this.currentCredentials(client);
        return this.listEventChanges(
          {
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken ?? credentials.refreshToken,
            expiryDate: refreshed.expiryDate,
          },
          calendarId,
        );
      }
      throw error;
    }

    if (!nextSyncToken) {
      throw new Error('Google Calendar did not return a sync token');
    }
    return {
      events,
      nextSyncToken,
      fullSync: !syncToken,
      credentials: this.currentCredentials(client),
    };
  }

  async watchEvents(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    input: GoogleCalendarWatchInput,
  ): Promise<GoogleCalendarWatchResult> {
    const client = this.createClient(credentials);
    const response = await google
      .calendar({ version: 'v3', auth: client })
      .events.watch({
        calendarId,
        requestBody: {
          id: input.channelId,
          type: 'web_hook',
          address: input.address,
          token: input.token,
          params: { ttl: String(input.ttlSeconds) },
        },
      });
    if (!response.data.id || !response.data.resourceId) {
      throw new Error('Google Calendar did not return a usable channel');
    }
    const expiration = Number(response.data.expiration);
    return {
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      expiresAt: Number.isFinite(expiration) ? new Date(expiration) : undefined,
      credentials: this.currentCredentials(client),
    };
  }

  async stopChannel(
    credentials: GoogleCalendarCredentials,
    channelId: string,
    resourceId: string,
  ): Promise<GoogleCalendarCredentialsResult> {
    const client = this.createClient(credentials);
    try {
      await google.calendar({ version: 'v3', auth: client }).channels.stop({
        requestBody: { id: channelId, resourceId },
      });
    } catch (error) {
      if (!this.isStatus(error, 404)) throw error;
    }
    return this.currentCredentials(client);
  }

  private createClient(credentials: GoogleCalendarCredentials) {
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: credentials.expiryDate,
    });
    return client;
  }

  private currentCredentials(
    client: InstanceType<typeof google.auth.OAuth2>,
  ): GoogleCalendarCredentialsResult {
    if (!client.credentials.access_token) {
      throw new Error('Google Calendar did not provide a usable access token');
    }
    return {
      accessToken: client.credentials.access_token,
      refreshToken: client.credentials.refresh_token ?? undefined,
      expiryDate: client.credentials.expiry_date ?? undefined,
    };
  }

  private toGoogleEvent(
    event: GoogleCalendarEventInput,
  ): calendar_v3.Schema$Event {
    return {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: event.timeZone,
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: event.timeZone,
      },
      extendedProperties: {
        private: {
          tacEtaripAppointmentId: event.appointmentId,
        },
      },
    };
  }

  private isMissingEvent(error: unknown): boolean {
    return this.isStatus(error, 404);
  }

  private isStatus(error: unknown, status: number): boolean {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as {
      code?: number;
      response?: { status?: number };
    };
    return candidate.code === status || candidate.response?.status === status;
  }
}
