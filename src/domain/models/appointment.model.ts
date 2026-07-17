import { AppointmentStatus } from '../enums/appointment-status.enum';
import {
  CalendarSyncOperation,
  CalendarSyncStatus,
} from '../enums/calendar-sync-status.enum';

export class Appointment {
  id!: string;
  companyId?: string;
  clientId!: string;
  userId!: string;
  title!: string;
  startTime!: Date;
  endTime!: Date;
  status!: AppointmentStatus;
  description?: string;
  externalEventId?: string | null;
  externalCalendarId?: string | null;
  meetingUrl?: string | null;
  calendarSyncStatus!: CalendarSyncStatus;
  calendarSyncOperation?: CalendarSyncOperation | null;
  calendarSyncError?: string | null;
  calendarSyncAttempts!: number;
  calendarSyncNextAttemptAt?: Date | null;
  calendarSyncedAt?: Date | null;
  deletedAt?: Date;
  constructor(partial: Partial<Appointment>) {
    Object.assign(this, partial);
  }
}
