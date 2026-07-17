import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { Appointment } from '@domain/models/appointment.model';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import {
  CalendarSyncOperation,
  CalendarSyncStatus,
} from '@domain/enums/calendar-sync-status.enum';
import { AppointmentOrmEntity } from '../entities/appointment.orm-entity';
import { AppointmentMapper } from '../mappers/appointment.mapper';

@Injectable()
export class AppointmentRepository implements IAppointmentRepository {
  constructor(
    @InjectRepository(AppointmentOrmEntity)
    private readonly repository: Repository<AppointmentOrmEntity>,
  ) {}

  async create(appointment: Partial<Appointment>): Promise<Appointment> {
    const ormEntity = AppointmentMapper.toOrmEntity(appointment);
    const savedEntity = await this.repository.save(ormEntity);
    return AppointmentMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Appointment | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? AppointmentMapper.toDomain(ormEntity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Appointment[]> {
    const ormEntities = await this.repository.find({
      where: { company: { id: companyId } },
      relations: ['company'],
    });
    return ormEntities.map((entity: AppointmentOrmEntity) =>
      AppointmentMapper.toDomain(entity),
    );
  }

  async findAllByClientId(clientId: string): Promise<Appointment[]> {
    const ormEntities = await this.repository.find({
      where: { client: { id: clientId } },
      relations: ['client'],
    });
    return ormEntities.map((entity: AppointmentOrmEntity) =>
      AppointmentMapper.toDomain(entity),
    );
  }

  async findUpcoming(from: Date, to: Date): Promise<Appointment[]> {
    const ormEntities = await this.repository.find({
      where: {
        startTime: Between(from, to),
      },
    });
    return ormEntities.map((entity) => AppointmentMapper.toDomain(entity));
  }

  async findByIdForCalendarSync(id: string): Promise<Appointment | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
      withDeleted: true,
    });
    return ormEntity ? AppointmentMapper.toDomain(ormEntity) : null;
  }

  async findByExternalEventId(
    userId: string,
    calendarId: string,
    eventId: string,
  ): Promise<Appointment | null> {
    const entity = await this.repository.findOne({
      where: {
        userId,
        externalCalendarId: calendarId,
        externalEventId: eventId,
      },
    });
    return entity ? AppointmentMapper.toDomain(entity) : null;
  }

  async findAllLinkedByUserCalendar(
    userId: string,
    calendarId: string,
  ): Promise<Appointment[]> {
    const entities = await this.repository
      .createQueryBuilder('appointment')
      .where('appointment.user_id = :userId', { userId })
      .andWhere('appointment.external_calendar_id = :calendarId', {
        calendarId,
      })
      .andWhere('appointment.external_event_id IS NOT NULL')
      .getMany();
    return entities.map((entity) => AppointmentMapper.toDomain(entity));
  }

  async findPendingCalendarSync(
    now: Date,
    limit: number,
  ): Promise<Appointment[]> {
    const ormEntities = await this.repository.find({
      where: [
        {
          calendarSyncStatus: In([
            CalendarSyncStatus.PENDING,
            CalendarSyncStatus.FAILED,
          ]),
          calendarSyncNextAttemptAt: IsNull(),
        },
        {
          calendarSyncStatus: In([
            CalendarSyncStatus.PENDING,
            CalendarSyncStatus.FAILED,
          ]),
          calendarSyncNextAttemptAt: LessThanOrEqual(now),
        },
      ],
      withDeleted: true,
      order: { calendarSyncNextAttemptAt: 'ASC' },
      take: limit,
    });
    return ormEntities.map((entity) => AppointmentMapper.toDomain(entity));
  }

  async expireScheduledBefore(cutoff: Date): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(AppointmentOrmEntity)
      .set({ status: AppointmentStatus.EXPIRED })
      .where('status = :scheduled', {
        scheduled: AppointmentStatus.SCHEDULED,
      })
      .andWhere('end_time <= :cutoff', { cutoff })
      .andWhere('deleted_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }

  async update(
    id: string,
    appointment: Partial<Appointment>,
  ): Promise<Appointment> {
    await this.repository.update(
      id,
      AppointmentMapper.toOrmEntity(appointment),
    );
    const updatedEntity = await this.repository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!updatedEntity) throw new Error('Appointment not found after update');
    return AppointmentMapper.toDomain(updatedEntity);
  }

  async scheduleAllForUser(userId: string): Promise<string[]> {
    const appointments = await this.repository.find({
      select: { id: true },
      where: {
        userId,
        status: AppointmentStatus.SCHEDULED,
        endTime: MoreThanOrEqual(new Date()),
      },
    });
    const ids = appointments.map((appointment) => appointment.id);
    if (ids.length === 0) return [];
    await this.repository.update(
      { id: In(ids) },
      {
        calendarSyncStatus: CalendarSyncStatus.PENDING,
        calendarSyncOperation: CalendarSyncOperation.UPSERT,
        calendarSyncError: null,
        calendarSyncAttempts: 0,
        calendarSyncNextAttemptAt: null,
      },
    );
    return ids;
  }

  async scheduleUnsyncedForGoogleUsers(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder()
      .update()
      .set({
        calendarSyncStatus: CalendarSyncStatus.PENDING,
        calendarSyncOperation: CalendarSyncOperation.UPSERT,
        calendarSyncError: null,
        calendarSyncAttempts: 0,
        calendarSyncNextAttemptAt: null,
      })
      .where('calendar_sync_status = :notSynced', {
        notSynced: CalendarSyncStatus.NOT_SYNCED,
      })
      .andWhere('status = :scheduled', {
        scheduled: AppointmentStatus.SCHEDULED,
      })
      .andWhere('end_time >= :now', { now: new Date() })
      .andWhere('deleted_at IS NULL')
      .andWhere(
        `user_id IN (
          SELECT gi.user_id
          FROM google_integrations gi
          INNER JOIN users u ON u.id = gi.user_id
          WHERE u.integration_provider = 'google' AND u.sync_calendar = true
        )`,
      )
      .returning(['id'])
      .execute();
    return (result.raw as Array<{ id: string }>).map((row) => row.id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async hardDelete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async delete(id: string): Promise<void> {
    await this.hardDelete(id);
  }
}
