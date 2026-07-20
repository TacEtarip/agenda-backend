import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentOrigin } from '../enums/payment-origin.enum';
import { PaymentSourceType } from '../enums/payment-source-type.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

export class Payment {
  id!: string;
  companyId!: string;
  clientId!: string;
  appointmentId?: string;
  clientProductId?: string;
  amount!: number;
  currency!: string;
  description!: string;
  status!: PaymentStatus;
  origin!: PaymentOrigin;
  method!: PaymentMethod;
  providerPaymentId?: string;
  checkoutUrl?: string;
  reference?: string;
  paidAt?: Date;
  statusChangedAt?: Date;
  statusChangedByUserId?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<Payment>) {
    Object.assign(this, partial);
  }

  sourceType!: PaymentSourceType;
  sourceId!: string;
}
