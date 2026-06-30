import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { CLIENT_PRODUCT_REPOSITORY } from '@domain/ports/client-product.repository.interface';
import type { IClientProductRepository } from '@domain/ports/client-product.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { PRODUCT_REPOSITORY } from '@domain/ports/product.repository.interface';
import type { IProductRepository } from '@domain/ports/product.repository.interface';
import {
  PAYMENT_REPOSITORY,
  PaymentListFilters,
} from '@domain/ports/payment.repository.interface';
import type { IPaymentRepository } from '@domain/ports/payment.repository.interface';
import { PAYMENT_PROVIDER } from '@domain/ports/payment.provider.interface';
import type { IPaymentProvider } from '@domain/ports/payment.provider.interface';
import { PaymentMethod } from '@domain/enums/payment-method.enum';
import { PaymentOrigin } from '@domain/enums/payment-origin.enum';
import { PaymentSourceType } from '@domain/enums/payment-source-type.enum';
import { PaymentStatus } from '@domain/enums/payment-status.enum';
import { Payment } from '@domain/models/payment.model';

export interface CreatePaymentInput {
  sourceType: PaymentSourceType;
  sourceId: string;
  amount: number;
  description?: string;
}

export interface RegisterManualPaymentInput extends CreatePaymentInput {
  method: PaymentMethod;
  paidAt: Date;
  reference?: string;
}

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: IPaymentRepository,
    @Inject(APPOINTMENT_REPOSITORY) private readonly appointments: IAppointmentRepository,
    @Inject(CLIENT_PRODUCT_REPOSITORY) private readonly clientProducts: IClientProductRepository,
    @Inject(CLIENT_REPOSITORY) private readonly clients: IClientRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
    @Inject(PAYMENT_PROVIDER) private readonly provider: IPaymentProvider,
    private readonly config: ConfigService,
  ) {}

  async createLink(input: CreatePaymentInput, companyId: string): Promise<Payment> {
    const source = await this.resolveSource(input.sourceType, input.sourceId, companyId);
    await this.assertNotPaid(input.sourceType, input.sourceId);
    await this.payments.cancelPendingForSource(input.sourceType, input.sourceId);

    let payment = await this.payments.create({
      companyId,
      clientId: source.clientId,
      appointmentId: input.sourceType === PaymentSourceType.APPOINTMENT ? input.sourceId : undefined,
      clientProductId: input.sourceType === PaymentSourceType.CLIENT_PRODUCT ? input.sourceId : undefined,
      amount: input.amount,
      currency: 'PEN',
      description: input.description?.trim() || source.description,
      status: PaymentStatus.PENDING,
      origin: PaymentOrigin.PAYMENT_LINK,
      method: PaymentMethod.ONLINE,
    });

    try {
      const intent = await this.provider.createPaymentIntent(
        input.amount,
        'PEN',
        payment.description,
        payment.id,
      );
      payment = await this.payments.update(payment.id, {
        providerPaymentId: intent.id,
        checkoutUrl: intent.checkoutUrl,
      });
      return payment;
    } catch {
      await this.payments.update(payment.id, { status: PaymentStatus.FAILED });
      throw new BadGatewayException('No se pudo generar el enlace de pago');
    }
  }

  async registerManual(input: RegisterManualPaymentInput, companyId: string): Promise<Payment> {
    if (input.method === PaymentMethod.ONLINE) {
      throw new BadRequestException('ONLINE is reserved for payment links');
    }
    const source = await this.resolveSource(input.sourceType, input.sourceId, companyId);
    await this.assertNotPaid(input.sourceType, input.sourceId);
    await this.payments.cancelPendingForSource(input.sourceType, input.sourceId);
    return this.payments.create({
      companyId,
      clientId: source.clientId,
      appointmentId: input.sourceType === PaymentSourceType.APPOINTMENT ? input.sourceId : undefined,
      clientProductId: input.sourceType === PaymentSourceType.CLIENT_PRODUCT ? input.sourceId : undefined,
      amount: input.amount,
      currency: 'PEN',
      description: input.description?.trim() || source.description,
      status: PaymentStatus.PAID,
      origin: PaymentOrigin.MANUAL,
      method: input.method,
      paidAt: input.paidAt,
      reference: input.reference?.trim() || undefined,
    });
  }

  list(filters: Omit<PaymentListFilters, 'companyId'>, companyId: string) {
    return this.payments.findAll({ ...filters, companyId });
  }

  async getSourceHistory(sourceType: PaymentSourceType, sourceId: string, companyId: string) {
    await this.resolveSource(sourceType, sourceId, companyId);
    return this.payments.findBySource(sourceType, sourceId);
  }

  async cancel(id: string, companyId: string): Promise<Payment> {
    const payment = await this.getOwnedPayment(id, companyId);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException('Only pending payments can be cancelled');
    }
    return this.payments.update(id, { status: PaymentStatus.CANCELLED });
  }

  async handleWebhook(providerPaymentId: string, status: PaymentStatus, signature?: string) {
    this.assertWebhookSignature(signature);
    const payment = await this.payments.findByProviderPaymentId(providerPaymentId);
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === status) return payment;
    const allowed = payment.status === PaymentStatus.PENDING
      ? [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELLED]
      : payment.status === PaymentStatus.PAID
        ? [PaymentStatus.REFUNDED]
        : [];
    if (!allowed.includes(status)) throw new ConflictException('Invalid payment transition');
    return this.payments.update(payment.id, {
      status,
      paidAt: status === PaymentStatus.PAID ? new Date() : undefined,
    });
  }

  private async getOwnedPayment(id: string, companyId: string): Promise<Payment> {
    const payment = await this.payments.findById(id);
    if (!payment || payment.companyId !== companyId) throw new NotFoundException('Payment not found');
    return payment;
  }

  private async assertNotPaid(sourceType: PaymentSourceType, sourceId: string) {
    if (await this.payments.findPaid(sourceType, sourceId)) {
      throw new ConflictException('This concept already has a confirmed payment');
    }
  }

  private async resolveSource(sourceType: PaymentSourceType, sourceId: string, companyId: string) {
    if (sourceType === PaymentSourceType.APPOINTMENT) {
      const appointment = await this.appointments.findById(sourceId);
      if (!appointment || appointment.companyId !== companyId) throw new NotFoundException('Appointment not found');
      const client = await this.clients.findById(appointment.clientId);
      if (!client || client.companyId !== companyId) throw new NotFoundException('Client not found');
      return { clientId: appointment.clientId, description: appointment.title };
    }

    const clientProduct = await this.clientProducts.findById(sourceId);
    if (!clientProduct) throw new NotFoundException('Client product not found');
    const client = await this.clients.findById(clientProduct.clientId);
    const product = await this.products.findById(clientProduct.productId);
    if (!client || client.companyId !== companyId || !product || product.companyId !== companyId) {
      throw new NotFoundException('Client product not found');
    }
    return { clientId: clientProduct.clientId, description: product.name };
  }

  private assertWebhookSignature(signature?: string) {
    const secret = this.config.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (!secret) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new ForbiddenException('Webhook secret is not configured');
      }
      return;
    }
    if (!signature) throw new ForbiddenException('Missing webhook signature');
    const expected = Buffer.from(secret);
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new ForbiddenException('Invalid webhook signature');
    }
  }
}
