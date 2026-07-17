import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppointmentScheduleConflictSource } from '@domain/models/appointment-schedule-conflict.model';
import { AppointmentOrmEntity } from './appointment.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('appointment_schedule_conflicts')
@Index('IDX_appointment_schedule_conflicts_active_appointment', [
  'appointmentId',
  'resolvedAt',
])
@Index('IDX_appointment_schedule_conflicts_active_google_event', [
  'userId',
  'source',
  'externalEventId',
  'resolvedAt',
])
export class AppointmentScheduleConflictOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'appointment_id', type: 'uuid' })
  appointmentId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: AppointmentScheduleConflictSource })
  source!: AppointmentScheduleConflictSource;

  @Column({ name: 'external_event_id', type: 'varchar' })
  externalEventId!: string;

  @Column({ name: 'conflict_start_time', type: 'timestamptz' })
  conflictStartTime!: Date;

  @Column({ name: 'conflict_end_time', type: 'timestamptz' })
  conflictEndTime!: Date;

  @CreateDateColumn({ name: 'detected_at', type: 'timestamptz' })
  detectedAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @ManyToOne(
    () => AppointmentOrmEntity,
    (appointment) => appointment.scheduleConflicts,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'appointment_id' })
  appointment!: AppointmentOrmEntity;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;
}
