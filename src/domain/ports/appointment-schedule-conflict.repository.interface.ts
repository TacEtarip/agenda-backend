export const APPOINTMENT_SCHEDULE_CONFLICT_REPOSITORY =
  'APPOINTMENT_SCHEDULE_CONFLICT_REPOSITORY';

export interface IAppointmentScheduleConflictRepository {
  replaceGoogleEventConflicts(input: {
    userId: string;
    externalEventId: string;
    startTime: Date;
    endTime: Date;
    appointmentIds: string[];
  }): Promise<void>;
  resolveGoogleEvent(userId: string, externalEventId: string): Promise<void>;
  resolveByAppointmentId(appointmentId: string): Promise<void>;
  resolveAllGoogleForUser(userId: string): Promise<void>;
  resolveMissingGoogleEvents(
    userId: string,
    seenExternalEventIds: string[],
  ): Promise<void>;
}
