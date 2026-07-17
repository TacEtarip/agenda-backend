import { Inject, Injectable } from '@nestjs/common';
import {
  APPOINTMENT_SCHEDULE_CONFLICT_REPOSITORY,
  type IAppointmentScheduleConflictRepository,
} from '@domain/ports/appointment-schedule-conflict.repository.interface';

@Injectable()
export class AppointmentScheduleConflictService {
  constructor(
    @Inject(APPOINTMENT_SCHEDULE_CONFLICT_REPOSITORY)
    private readonly conflicts: IAppointmentScheduleConflictRepository,
  ) {}

  recordGoogleEvent(input: {
    userId: string;
    externalEventId: string;
    startTime: Date;
    endTime: Date;
    appointmentIds: string[];
  }): Promise<void> {
    return this.conflicts.replaceGoogleEventConflicts(input);
  }

  resolveGoogleEvent(userId: string, externalEventId: string): Promise<void> {
    return this.conflicts.resolveGoogleEvent(userId, externalEventId);
  }

  resolveAppointment(appointmentId: string): Promise<void> {
    return this.conflicts.resolveByAppointmentId(appointmentId);
  }

  resolveAllGoogleForUser(userId: string): Promise<void> {
    return this.conflicts.resolveAllGoogleForUser(userId);
  }

  resolveMissingGoogleEvents(
    userId: string,
    seenExternalEventIds: Set<string>,
  ): Promise<void> {
    return this.conflicts.resolveMissingGoogleEvents(userId, [
      ...seenExternalEventIds,
    ]);
  }
}
