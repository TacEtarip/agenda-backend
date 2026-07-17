import { Appointment } from '@domain/models/appointment.model';
import { AppointmentOrmEntity } from '../entities/appointment.orm-entity';
import { AppointmentScheduleConflict } from '@domain/models/appointment-schedule-conflict.model';

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
      externalEventId: ormEntity.externalEventId ?? undefined,
      externalCalendarId: ormEntity.externalCalendarId ?? undefined,
      meetingUrl: ormEntity.meetingUrl ?? undefined,
      calendarSyncStatus: ormEntity.calendarSyncStatus,
      calendarSyncOperation: ormEntity.calendarSyncOperation ?? undefined,
      calendarSyncError: ormEntity.calendarSyncError ?? undefined,
      calendarSyncAttempts: ormEntity.calendarSyncAttempts,
      calendarSyncNextAttemptAt:
        ormEntity.calendarSyncNextAttemptAt ?? undefined,
      calendarSyncedAt: ormEntity.calendarSyncedAt ?? undefined,
      scheduleConflicts: ormEntity.scheduleConflicts
        ?.filter((conflict) => !conflict.resolvedAt)
        .map(
          (conflict) =>
            new AppointmentScheduleConflict({
              id: conflict.id,
              appointmentId: conflict.appointmentId,
              userId: conflict.userId,
              source: conflict.source,
              conflictStartTime: conflict.conflictStartTime,
              conflictEndTime: conflict.conflictEndTime,
              detectedAt: conflict.detectedAt,
              resolvedAt: conflict.resolvedAt,
            }),
        ),
      deletedAt: ormEntity.deletedAt ?? undefined,
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
    if (domainAppointment.externalCalendarId !== undefined)
      ormEntity.externalCalendarId = domainAppointment.externalCalendarId;
    if (domainAppointment.meetingUrl !== undefined)
      ormEntity.meetingUrl = domainAppointment.meetingUrl;
    if (domainAppointment.calendarSyncStatus !== undefined)
      ormEntity.calendarSyncStatus = domainAppointment.calendarSyncStatus;
    if (domainAppointment.calendarSyncOperation !== undefined)
      ormEntity.calendarSyncOperation = domainAppointment.calendarSyncOperation;
    if (domainAppointment.calendarSyncError !== undefined)
      ormEntity.calendarSyncError = domainAppointment.calendarSyncError;
    if (domainAppointment.calendarSyncAttempts !== undefined)
      ormEntity.calendarSyncAttempts = domainAppointment.calendarSyncAttempts;
    if (domainAppointment.calendarSyncNextAttemptAt !== undefined)
      ormEntity.calendarSyncNextAttemptAt =
        domainAppointment.calendarSyncNextAttemptAt;
    if (domainAppointment.calendarSyncedAt !== undefined)
      ormEntity.calendarSyncedAt = domainAppointment.calendarSyncedAt;
    return ormEntity;
  }
}
