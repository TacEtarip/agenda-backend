import { Appointment } from '@domain/models/appointment.model';
import { AppointmentOrmEntity } from '../entities/appointment.orm-entity';

export class AppointmentMapper {
  static toDomain(ormEntity: AppointmentOrmEntity): Appointment {
    return new Appointment({
      id: ormEntity.id,
      clientId: ormEntity.clientId,
      userId: ormEntity.userId,
      title: ormEntity.title,
      startTime: ormEntity.startTime,
      endTime: ormEntity.endTime,
      status: ormEntity.status,
      description: ormEntity.description,
      googleEventId: ormEntity.googleEventId,
    });
  }

  static toOrmEntity(
    domainAppointment: Partial<Appointment>,
  ): AppointmentOrmEntity {
    const ormEntity = new AppointmentOrmEntity();
    if (domainAppointment.id) ormEntity.id = domainAppointment.id;
    if (domainAppointment.clientId)
      ormEntity.clientId = domainAppointment.clientId;
    if (domainAppointment.userId) ormEntity.userId = domainAppointment.userId;
    if (domainAppointment.title) ormEntity.title = domainAppointment.title;
    if (domainAppointment.startTime)
      ormEntity.startTime = domainAppointment.startTime;
    if (domainAppointment.endTime)
      ormEntity.endTime = domainAppointment.endTime;
    if (domainAppointment.status) ormEntity.status = domainAppointment.status;
    if (domainAppointment.description !== undefined)
      ormEntity.description = domainAppointment.description;
    if (domainAppointment.googleEventId !== undefined)
      ormEntity.googleEventId = domainAppointment.googleEventId;
    return ormEntity;
  }
}
