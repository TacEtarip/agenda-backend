import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClientOrmEntity } from './client.orm-entity';
import { AppointmentOrmEntity } from './appointment.orm-entity';
import { ProductOrmEntity } from './product.orm-entity';
import { CompanyOrmEntity } from './company.orm-entity';

@Entity('users')
export class UserOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', nullable: true })
  companyId!: string;

  @ManyToOne(
    () => CompanyOrmEntity,
    (company: CompanyOrmEntity) => company.users,
  )
  @JoinColumn({ name: 'company_id' })
  company!: CompanyOrmEntity;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash!: string;

  @Column({ name: 'google_id', unique: true, nullable: true })
  googleId!: string;

  @Column({ name: 'microsoft_id', unique: true, nullable: true })
  microsoftId!: string;

  @Column({ name: 'first_name' })
  firstName!: string;

  @Column({ name: 'last_name' })
  lastName!: string;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Column({ name: 'integration_provider', default: 'none' })
  integrationProvider!: string;

  @Column({ name: 'sync_calendar', default: true })
  syncCalendar!: boolean;

  @Column({ name: 'sync_contacts', default: false })
  syncContacts!: boolean;

  @Column({ name: 'send_daily_digest', default: true })
  sendDailyDigest!: boolean;

  @Column({ name: 'payment_enabled', default: false })
  paymentEnabled!: boolean;

  @Column({ name: 'payment_gateway_key', nullable: true })
  paymentGatewayKey!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @OneToMany(() => ClientOrmEntity, (client) => client.user)
  clients!: ClientOrmEntity[];

  @OneToMany(() => AppointmentOrmEntity, (appointment) => appointment.user)
  appointments!: AppointmentOrmEntity[];

  @OneToMany(() => ProductOrmEntity, (product) => product.user)
  products!: ProductOrmEntity[];
}
