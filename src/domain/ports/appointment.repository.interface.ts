import { Appointment } from '../models/appointment.model';

export const APPOINTMENT_REPOSITORY = 'APPOINTMENT_REPOSITORY';

export interface IAppointmentRepository {
  create(appointment: Partial<Appointment>): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  findAllByUserId(userId: string): Promise<Appointment[]>;
  findAllByClientId(clientId: string): Promise<Appointment[]>;
  findUpcoming(from: Date, to: Date): Promise<Appointment[]>;
  update(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  delete(id: string): Promise<void>;
}
