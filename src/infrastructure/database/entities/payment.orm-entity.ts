import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod } from '@domain/enums/payment-method.enum';
import { PaymentOrigin } from '@domain/enums/payment-origin.enum';
import { PaymentStatus } from '@domain/enums/payment-status.enum';
import { CompanyOrmEntity } from './company.orm-entity';
import { ClientOrmEntity } from './client.orm-entity';
import { AppointmentOrmEntity } from './appointment.orm-entity';
import { ClientProductOrmEntity } from './client-product.orm-entity';

@Entity('payments')
@Check(
  'CHK_payments_exactly_one_source',
  '("appointment_id" IS NOT NULL) <> ("client_product_id" IS NOT NULL)',
)
@Index('IDX_payments_company_status', ['companyId', 'status'])
@Index('IDX_payments_client', ['clientId'])
@Index('IDX_payments_appointment', ['appointmentId'])
@Index('IDX_payments_client_product', ['clientProductId'])
@Index('UQ_payments_pending_appointment', ['appointmentId'], { unique: true, where: '"status" = \'PENDING\' AND "appointment_id" IS NOT NULL' })
@Index('UQ_payments_paid_appointment', ['appointmentId'], { unique: true, where: '"status" = \'PAID\' AND "appointment_id" IS NOT NULL' })
@Index('UQ_payments_pending_client_product', ['clientProductId'], { unique: true, where: '"status" = \'PENDING\' AND "client_product_id" IS NOT NULL' })
@Index('UQ_payments_paid_client_product', ['clientProductId'], { unique: true, where: '"status" = \'PAID\' AND "client_product_id" IS NOT NULL' })
@Index('UQ_payments_provider_payment_id', ['providerPaymentId'], {
  unique: true,
  where: '"provider_payment_id" IS NOT NULL',
})
export class PaymentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId!: string;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId!: string | null;

  @Column({ name: 'client_product_id', type: 'uuid', nullable: true })
  clientProductId!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: number;

  @Column({ length: 3, default: 'PEN' })
  currency!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  status!: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentOrigin })
  origin!: PaymentOrigin;

  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @Column({ name: 'provider_payment_id', type: 'varchar', nullable: true })
  providerPaymentId!: string | null;

  @Column({ name: 'checkout_url', type: 'text', nullable: true })
  checkoutUrl!: string | null;

  @Column({ type: 'varchar', nullable: true })
  reference!: string | null;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => CompanyOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyOrmEntity;

  @ManyToOne(() => ClientOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_id' })
  client!: ClientOrmEntity;

  @ManyToOne(() => AppointmentOrmEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: AppointmentOrmEntity | null;

  @ManyToOne(() => ClientProductOrmEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_product_id' })
  clientProduct!: ClientProductOrmEntity | null;
}
