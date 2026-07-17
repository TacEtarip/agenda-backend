export enum AppointmentScheduleConflictSource {
  GOOGLE = 'google',
}

export class AppointmentScheduleConflict {
  id!: string;
  appointmentId!: string;
  userId!: string;
  source!: AppointmentScheduleConflictSource;
  externalEventId!: string;
  conflictStartTime!: Date;
  conflictEndTime!: Date;
  detectedAt!: Date;
  resolvedAt?: Date | null;

  constructor(partial: Partial<AppointmentScheduleConflict>) {
    Object.assign(this, partial);
  }
}
