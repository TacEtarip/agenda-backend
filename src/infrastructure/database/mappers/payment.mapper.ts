import { Payment } from '@domain/models/payment.model';
import { PaymentOrmEntity } from '../entities/payment.orm-entity';
import { PaymentSourceType } from '@domain/enums/payment-source-type.enum';

export class PaymentMapper {
  static toDomain(entity: PaymentOrmEntity): Payment {
    return new Payment({
      ...entity,
      amount: Number(entity.amount),
      appointmentId: entity.appointmentId || undefined,
      clientProductId: entity.clientProductId || undefined,
      providerPaymentId: entity.providerPaymentId || undefined,
      checkoutUrl: entity.checkoutUrl || undefined,
      reference: entity.reference || undefined,
      paidAt: entity.paidAt || undefined,
      sourceType: entity.appointmentId
        ? PaymentSourceType.APPOINTMENT
        : PaymentSourceType.CLIENT_PRODUCT,
      sourceId: entity.appointmentId || entity.clientProductId || '',
    });
  }

  static toOrmEntity(payment: Partial<Payment>): Partial<PaymentOrmEntity> {
    return {
      id: payment.id,
      companyId: payment.companyId,
      clientId: payment.clientId,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description,
      status: payment.status,
      origin: payment.origin,
      method: payment.method,
      providerPaymentId: payment.providerPaymentId,
      checkoutUrl: payment.checkoutUrl,
      reference: payment.reference,
      paidAt: payment.paidAt,
      appointmentId: payment.appointmentId ?? undefined,
      clientProductId: payment.clientProductId ?? undefined,
    };
  }
}
