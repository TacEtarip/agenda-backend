import { Appointment } from '@domain/models/appointment.model';
import { AppointmentOrmEntity } from '../entities/appointment.orm-entity';

export class AppointmentMapper {
  static toDomain(ormEntity: AppointmentOrmEntity): Appointment {
    return new Appointment({
      id: ormEntity.id,
      companyId: ormEntity.companyId,
      clientId: ormEntity.clientId,
      userId: ormEntity.userId,
      title: ormEntity.title,
      startTime: ormEntity.startTime,
      endTime: ormEntity.endTime,
      status: ormEntity.status,
      description: ormEntity.description,
      externalEventId: ormEntity.externalEventId,
      meetingUrl: ormEntity.meetingUrl,
      paymentId: ormEntity.paymentId,
      paymentUrl: ormEntity.paymentUrl,
    });
  }

  static toOrmEntity(
    domainAppointment: Partial<Appointment>,
  ): AppointmentOrmEntity {
    const ormEntity = new AppointmentOrmEntity();
    if (domainAppointment.id) ormEntity.id = domainAppointment.id;
    if (domainAppointment.companyId !== undefined)
      ormEntity.companyId = domainAppointment.companyId!;
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
    if (domainAppointment.externalEventId !== undefined)
      ormEntity.externalEventId = domainAppointment.externalEventId;
    if (domainAppointment.meetingUrl !== undefined)
      ormEntity.meetingUrl = domainAppointment.meetingUrl;
    if (domainAppointment.paymentId !== undefined)
      ormEntity.paymentId = domainAppointment.paymentId;
    if (domainAppointment.paymentUrl !== undefined)
      ormEntity.paymentUrl = domainAppointment.paymentUrl;
    return ormEntity;
  }
}
