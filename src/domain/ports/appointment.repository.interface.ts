import { Appointment } from '../models/appointment.model';

export const APPOINTMENT_REPOSITORY = 'APPOINTMENT_REPOSITORY';

export interface IAppointmentRepository {
  create(appointment: Partial<Appointment>): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findAllByCompanyId(companyId: string): Promise<Appointment[]>;
  findAllByClientId(clientId: string): Promise<Appointment[]>;
  findUpcoming(from: Date, to: Date): Promise<Appointment[]>;
  findByIdForCalendarSync(id: string): Promise<Appointment | null>;
  findByExternalEventId(
    userId: string,
    calendarId: string,
    eventId: string,
  ): Promise<Appointment | null>;
  findAllLinkedByUserCalendar(
    userId: string,
    calendarId: string,
  ): Promise<Appointment[]>;
  findPendingCalendarSync(now: Date, limit: number): Promise<Appointment[]>;
  expireScheduledBefore(cutoff: Date): Promise<number>;
  update(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  scheduleAllForUser(userId: string): Promise<string[]>;
  scheduleUnsyncedForGoogleUsers(): Promise<string[]>;
  softDelete(id: string): Promise<void>;
  hardDelete(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
