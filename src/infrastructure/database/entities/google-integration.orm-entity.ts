import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyOrmEntity } from './company.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('google_integrations')
@Index('IDX_google_integrations_company', ['companyId'])
export class GoogleIntegrationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'google_subject', unique: true })
  googleSubject!: string;

  @Column()
  email!: string;

  @Column({ name: 'access_token_encrypted', type: 'text' })
  accessTokenEncrypted!: string;

  @Column({ name: 'refresh_token_encrypted', type: 'text', nullable: true })
  refreshTokenEncrypted!: string | null;

  @Column({ type: 'text' })
  scope!: string;

  @Column({ name: 'token_type', default: 'Bearer' })
  tokenType!: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'calendar_id', default: 'primary' })
  calendarId!: string;

  @Column({ name: 'calendar_sync_token', type: 'text', nullable: true })
  calendarSyncToken!: string | null;

  @Column({
    name: 'webhook_channel_id',
    type: 'varchar',
    unique: true,
    nullable: true,
  })
  webhookChannelId!: string | null;

  @Column({ name: 'webhook_resource_id', type: 'varchar', nullable: true })
  webhookResourceId!: string | null;

  @Column({
    name: 'webhook_token_hash',
    type: 'char',
    length: 64,
    nullable: true,
  })
  webhookTokenHash!: string | null;

  @Column({ name: 'webhook_expires_at', type: 'timestamptz', nullable: true })
  webhookExpiresAt!: Date | null;

  @Column({ name: 'inbound_synced_at', type: 'timestamptz', nullable: true })
  inboundSyncedAt!: Date | null;

  @Column({ name: 'inbound_sync_error', type: 'text', nullable: true })
  inboundSyncError!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;

  @ManyToOne(() => CompanyOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyOrmEntity;
}
