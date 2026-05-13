import { AppointmentStatus } from '../enums/appointment-status.enum';

export class Appointment {
  id!: string;
  clientId!: string;
  userId!: string;
  title!: string;
  startTime!: Date;
  endTime!: Date;
  status!: AppointmentStatus;
  description?: string;
  externalEventId?: string;
  meetingUrl?: string;
  // Nuevos campos opcionales para manejo de pagos
  paymentId?: string;
  paymentUrl?: string;

  constructor(partial: Partial<Appointment>) {
    Object.assign(this, partial);
  }
}
