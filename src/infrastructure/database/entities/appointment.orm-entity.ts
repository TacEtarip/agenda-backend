import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import {
  CalendarSyncOperation,
  CalendarSyncStatus,
} from '@domain/enums/calendar-sync-status.enum';
import { ClientOrmEntity } from './client.orm-entity';
import { UserOrmEntity } from './user.orm-entity';
import { CompanyOrmEntity } from './company.orm-entity';

@Entity('appointments')
@Index('IDX_appointments_calendar_sync_due', [
  'calendarSyncStatus',
  'calendarSyncNextAttemptAt',
])
@Index('IDX_appointments_scheduled_end_time', ['endTime'], {
  where: `"status" = 'scheduled' AND "deleted_at" IS NULL`,
})
@Index(
  'IDX_appointments_external_calendar_event',
  ['userId', 'externalCalendarId', 'externalEventId'],
  { where: '"external_event_id" IS NOT NULL' },
)
export class AppointmentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', nullable: true })
  companyId!: string;

  @ManyToOne(
    () => CompanyOrmEntity,
    (company: CompanyOrmEntity) => company.appointments,
  )
  @JoinColumn({ name: 'company_id' })
  company!: CompanyOrmEntity;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ name: 'start_time', type: 'timestamptz' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'timestamptz' })
  endTime!: Date;

  @Column({ name: 'external_event_id', type: 'varchar', nullable: true })
  externalEventId!: string | null;

  @Column({ name: 'external_calendar_id', type: 'varchar', nullable: true })
  externalCalendarId!: string | null;

  @Column({ name: 'meeting_url', type: 'varchar', nullable: true })
  meetingUrl!: string | null;

  @Column({
    name: 'calendar_sync_status',
    type: 'enum',
    enum: CalendarSyncStatus,
    default: CalendarSyncStatus.NOT_SYNCED,
  })
  calendarSyncStatus!: CalendarSyncStatus;

  @Column({
    name: 'calendar_sync_operation',
    type: 'enum',
    enum: CalendarSyncOperation,
    nullable: true,
  })
  calendarSyncOperation!: CalendarSyncOperation | null;

  @Column({ name: 'calendar_sync_error', type: 'text', nullable: true })
  calendarSyncError!: string | null;

  @Column({ name: 'calendar_sync_attempts', type: 'integer', default: 0 })
  calendarSyncAttempts!: number;

  @Column({
    name: 'calendar_sync_next_attempt_at',
    type: 'timestamptz',
    nullable: true,
  })
  calendarSyncNextAttemptAt!: Date | null;

  @Column({ name: 'calendar_synced_at', type: 'timestamptz', nullable: true })
  calendarSyncedAt!: Date | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status!: AppointmentStatus;

  // Foreign Keys
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  // Relations
  @ManyToOne(() => ClientOrmEntity, (client) => client.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id' })
  client!: ClientOrmEntity;

  @ManyToOne(() => UserOrmEntity, (user) => user.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;
}
