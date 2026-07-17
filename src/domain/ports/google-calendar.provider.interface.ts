export const GOOGLE_CALENDAR_PROVIDER = 'GOOGLE_CALENDAR_PROVIDER';

export interface GoogleCalendarCredentials {
  accessToken: string;
  refreshToken: string;
  expiryDate?: number;
}

export interface GoogleCalendarEventInput {
  appointmentId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  timeZone: string;
}

export interface GoogleCalendarCredentialsResult {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
}

export interface GoogleCalendarEventResult {
  eventId: string;
  credentials: GoogleCalendarCredentialsResult;
}

export interface GoogleCalendarBusyInterval {
  eventId: string;
  startTime: Date;
  endTime: Date;
}

export interface GoogleCalendarBusyResult {
  intervals: GoogleCalendarBusyInterval[];
  credentials: GoogleCalendarCredentialsResult;
}

export interface GoogleCalendarAvailabilityInput {
  startTime: Date;
  endTime: Date;
  timeZone: string;
  excludeEventId?: string;
}

export interface GoogleCalendarEventChange {
  eventId: string;
  appointmentId?: string;
  status: string;
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  updatedAt?: Date;
  isBusy?: boolean;
}

export interface GoogleCalendarChangesResult {
  events: GoogleCalendarEventChange[];
  nextSyncToken: string;
  fullSync: boolean;
  credentials: GoogleCalendarCredentialsResult;
}

export interface GoogleCalendarWatchInput {
  channelId: string;
  address: string;
  token: string;
  ttlSeconds: number;
}

export interface GoogleCalendarWatchResult {
  channelId: string;
  resourceId: string;
  expiresAt?: Date;
  credentials: GoogleCalendarCredentialsResult;
}

export interface IGoogleCalendarProvider {
  listBusyIntervals(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    input: GoogleCalendarAvailabilityInput,
  ): Promise<GoogleCalendarBusyResult>;
  createEvent(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    event: GoogleCalendarEventInput,
  ): Promise<GoogleCalendarEventResult>;
  updateEvent(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    eventId: string,
    event: GoogleCalendarEventInput,
  ): Promise<GoogleCalendarEventResult | null>;
  deleteEvent(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    eventId: string,
  ): Promise<GoogleCalendarCredentialsResult>;
  listEventChanges(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    syncToken?: string,
  ): Promise<GoogleCalendarChangesResult>;
  watchEvents(
    credentials: GoogleCalendarCredentials,
    calendarId: string,
    input: GoogleCalendarWatchInput,
  ): Promise<GoogleCalendarWatchResult>;
  stopChannel(
    credentials: GoogleCalendarCredentials,
    channelId: string,
    resourceId: string,
  ): Promise<GoogleCalendarCredentialsResult>;
}
