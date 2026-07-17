import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { AppointmentScheduleConflictSource } from '@domain/models/appointment-schedule-conflict.model';
import { IAppointmentScheduleConflictRepository } from '@domain/ports/appointment-schedule-conflict.repository.interface';
import { AppointmentScheduleConflictOrmEntity } from '../entities/appointment-schedule-conflict.orm-entity';

@Injectable()
export class AppointmentScheduleConflictRepository implements IAppointmentScheduleConflictRepository {
  constructor(
    @InjectRepository(AppointmentScheduleConflictOrmEntity)
    private readonly repository: Repository<AppointmentScheduleConflictOrmEntity>,
  ) {}

  async replaceGoogleEventConflicts(input: {
    userId: string;
    externalEventId: string;
    startTime: Date;
    endTime: Date;
    appointmentIds: string[];
  }): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(
        AppointmentScheduleConflictOrmEntity,
      );
      await repository.update(
        {
          userId: input.userId,
          source: AppointmentScheduleConflictSource.GOOGLE,
          externalEventId: input.externalEventId,
          resolvedAt: IsNull(),
        },
        { resolvedAt: new Date() },
      );
      if (input.appointmentIds.length === 0) return;
      await repository.insert(
        input.appointmentIds.map((appointmentId) => ({
          appointmentId,
          userId: input.userId,
          source: AppointmentScheduleConflictSource.GOOGLE,
          externalEventId: input.externalEventId,
          conflictStartTime: input.startTime,
          conflictEndTime: input.endTime,
        })),
      );
    });
  }

  async resolveGoogleEvent(
    userId: string,
    externalEventId: string,
  ): Promise<void> {
    await this.repository.update(
      {
        userId,
        source: AppointmentScheduleConflictSource.GOOGLE,
        externalEventId,
        resolvedAt: IsNull(),
      },
      { resolvedAt: new Date() },
    );
  }

  async resolveByAppointmentId(appointmentId: string): Promise<void> {
    await this.repository.update(
      { appointmentId, resolvedAt: IsNull() },
      { resolvedAt: new Date() },
    );
  }

  async resolveAllGoogleForUser(userId: string): Promise<void> {
    await this.repository.update(
      {
        userId,
        source: AppointmentScheduleConflictSource.GOOGLE,
        resolvedAt: IsNull(),
      },
      { resolvedAt: new Date() },
    );
  }

  async resolveMissingGoogleEvents(
    userId: string,
    seenExternalEventIds: string[],
  ): Promise<void> {
    const where = {
      userId,
      source: AppointmentScheduleConflictSource.GOOGLE,
      resolvedAt: IsNull(),
      ...(seenExternalEventIds.length > 0
        ? { externalEventId: Not(In(seenExternalEventIds)) }
        : {}),
    };
    await this.repository.update(where, { resolvedAt: new Date() });
  }
}
