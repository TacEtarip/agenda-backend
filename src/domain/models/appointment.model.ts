import { AppointmentStatus } from '../enums/appointment-status.enum';

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
  externalEventId?: string;
  meetingUrl?: string;
  constructor(partial: Partial<Appointment>) {
    Object.assign(this, partial);
  }
}
