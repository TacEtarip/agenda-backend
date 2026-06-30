import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AppointmentStatus } from '@domain/enums/appointment-status.enum';
import { ClientOrmEntity } from './client.orm-entity';
import { UserOrmEntity } from './user.orm-entity';
import { CompanyOrmEntity } from './company.orm-entity';

@Entity('appointments')
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

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime!: Date;

  @Column({ name: 'external_event_id', nullable: true })
  externalEventId!: string;

  @Column({ name: 'meeting_url', nullable: true })
  meetingUrl!: string;

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
