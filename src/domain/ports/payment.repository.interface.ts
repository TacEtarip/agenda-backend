import { PaymentSourceType } from '../enums/payment-source-type.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { Payment } from '../models/payment.model';

export const PAYMENT_REPOSITORY = 'PAYMENT_REPOSITORY';

export interface PaymentListFilters {
  companyId: string;
  status?: PaymentStatus;
  clientId?: string;
  sourceType?: PaymentSourceType;
  sourceId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export interface PaymentListResult {
  items: Payment[];
  total: number;
  page: number;
  limit: number;
}

export interface IPaymentRepository {
  create(payment: Partial<Payment>): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByProviderPaymentId(providerPaymentId: string): Promise<Payment | null>;
  findBySource(sourceType: PaymentSourceType, sourceId: string): Promise<Payment[]>;
  findActivePending(sourceType: PaymentSourceType, sourceId: string): Promise<Payment | null>;
  findPaid(sourceType: PaymentSourceType, sourceId: string): Promise<Payment | null>;
  findAll(filters: PaymentListFilters): Promise<PaymentListResult>;
  update(id: string, payment: Partial<Payment>): Promise<Payment>;
  cancelPendingForSource(sourceType: PaymentSourceType, sourceId: string): Promise<void>;
}
