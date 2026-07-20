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
import { timingSafeEqual } from 'node:crypto';
import { APPOINTMENT_REPOSITORY } from '@domain/ports/appointment.repository.interface';
import type { IAppointmentRepository } from '@domain/ports/appointment.repository.interface';
import { CLIENT_PRODUCT_REPOSITORY } from '@domain/ports/client-product.repository.interface';
import type { IClientProductRepository } from '@domain/ports/client-product.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { COMPANY_REPOSITORY } from '@domain/ports/company.repository.interface';
import type { ICompanyRepository } from '@domain/ports/company.repository.interface';
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
import { YapeQrImageService } from './yape-qr-image.service';

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

export interface YapeConfiguration {
  enabled: boolean;
  phone?: string;
  accountName?: string;
  qrImageDataUrl?: string | null;
}

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly payments: IPaymentRepository,
    @Inject(APPOINTMENT_REPOSITORY)
    private readonly appointments: IAppointmentRepository,
    @Inject(CLIENT_PRODUCT_REPOSITORY)
    private readonly clientProducts: IClientProductRepository,
    @Inject(CLIENT_REPOSITORY) private readonly clients: IClientRepository,
    @Inject(COMPANY_REPOSITORY) private readonly companies: ICompanyRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: IProductRepository,
    @Inject(PAYMENT_PROVIDER) private readonly provider: IPaymentProvider,
    private readonly config: ConfigService,
    private readonly yapeQrImages: YapeQrImageService,
  ) {}

  async getYapeConfiguration(companyId: string): Promise<YapeConfiguration> {
    const company = await this.companies.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    return {
      enabled: company.yapeEnabled ?? false,
      phone: company.yapePhone,
      accountName: company.yapeAccountName,
      qrImageDataUrl: company.yapeQrImageDataUrl,
    };
  }

  async updateYapeConfiguration(
    companyId: string,
    input: YapeConfiguration,
  ): Promise<YapeConfiguration> {
    const phone = input.phone?.trim();
    const accountName = input.accountName?.trim();
    if (input.enabled && (!phone || !accountName)) {
      throw new BadRequestException(
        'Yape phone and account name are required when direct Yape is enabled',
      );
    }
    await this.getYapeConfiguration(companyId);
    const qrImageDataUrl = input.qrImageDataUrl
      ? await this.yapeQrImages.sanitize(input.qrImageDataUrl)
      : '';
    const company = await this.companies.update(companyId, {
      yapeEnabled: input.enabled,
      yapePhone: phone ?? '',
      yapeAccountName: accountName ?? '',
      yapeQrImageDataUrl: qrImageDataUrl,
    });
    return {
      enabled: company.yapeEnabled ?? false,
      phone: company.yapePhone,
      accountName: company.yapeAccountName,
      qrImageDataUrl: company.yapeQrImageDataUrl,
    };
  }

  async createYapeRequest(
    input: CreatePaymentInput,
    companyId: string,
  ): Promise<Payment> {
    const configuration = await this.getYapeConfiguration(companyId);
    if (
      !configuration.enabled ||
      !configuration.phone ||
      !configuration.accountName
    ) {
      throw new BadRequestException('Direct Yape payments are not configured');
    }
    const source = await this.resolveSource(
      input.sourceType,
      input.sourceId,
      companyId,
    );
    await this.assertNotPaid(input.sourceType, input.sourceId);
    await this.payments.cancelPendingForSource(
      input.sourceType,
      input.sourceId,
    );
    return this.payments.create({
      companyId,
      clientId: source.clientId,
      appointmentId:
        input.sourceType === PaymentSourceType.APPOINTMENT
          ? input.sourceId
          : undefined,
      clientProductId:
        input.sourceType === PaymentSourceType.CLIENT_PRODUCT
          ? input.sourceId
          : undefined,
      amount: input.amount,
      currency: 'PEN',
      description: input.description?.trim() || source.description,
      status: PaymentStatus.PENDING,
      origin: PaymentOrigin.DIRECT_YAPE,
      method: PaymentMethod.YAPE,
    });
  }

  async confirmYapePayment(
    id: string,
    companyId: string,
    actorUserId: string,
    reference?: string,
  ): Promise<Payment> {
    const payment = await this.getOwnedPayment(id, companyId);
    if (
      payment.status !== PaymentStatus.PENDING ||
      payment.origin !== PaymentOrigin.DIRECT_YAPE ||
      payment.method !== PaymentMethod.YAPE
    ) {
      throw new ConflictException(
        'Payment is not a pending direct Yape request',
      );
    }
    const updated = await this.payments.transitionStatus(
      id,
      companyId,
      PaymentStatus.PENDING,
      PaymentStatus.PAID,
      {
        paidAt: new Date(),
        reference: reference?.trim() || undefined,
        statusChangedAt: new Date(),
        statusChangedByUserId: actorUserId,
      },
    );
    if (!updated) {
      throw new ConflictException('Payment is no longer pending');
    }
    return updated;
  }

  async createLink(
    input: CreatePaymentInput,
    companyId: string,
  ): Promise<Payment> {
    const source = await this.resolveSource(
      input.sourceType,
      input.sourceId,
      companyId,
    );
    await this.assertNotPaid(input.sourceType, input.sourceId);
    await this.payments.cancelPendingForSource(
      input.sourceType,
      input.sourceId,
    );

    let payment = await this.payments.create({
      companyId,
      clientId: source.clientId,
      appointmentId:
        input.sourceType === PaymentSourceType.APPOINTMENT
          ? input.sourceId
          : undefined,
      clientProductId:
        input.sourceType === PaymentSourceType.CLIENT_PRODUCT
          ? input.sourceId
          : undefined,
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

  async registerManual(
    input: RegisterManualPaymentInput,
    companyId: string,
  ): Promise<Payment> {
    if (input.method === PaymentMethod.ONLINE) {
      throw new BadRequestException('ONLINE is reserved for payment links');
    }
    const source = await this.resolveSource(
      input.sourceType,
      input.sourceId,
      companyId,
    );
    await this.assertNotPaid(input.sourceType, input.sourceId);
    await this.payments.cancelPendingForSource(
      input.sourceType,
      input.sourceId,
    );
    return this.payments.create({
      companyId,
      clientId: source.clientId,
      appointmentId:
        input.sourceType === PaymentSourceType.APPOINTMENT
          ? input.sourceId
          : undefined,
      clientProductId:
        input.sourceType === PaymentSourceType.CLIENT_PRODUCT
          ? input.sourceId
          : undefined,
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

  async getSourceHistory(
    sourceType: PaymentSourceType,
    sourceId: string,
    companyId: string,
  ) {
    await this.resolveSource(sourceType, sourceId, companyId);
    return this.payments.findBySource(sourceType, sourceId);
  }

  async cancel(
    id: string,
    companyId: string,
    actorUserId: string,
  ): Promise<Payment> {
    const payment = await this.getOwnedPayment(id, companyId);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new ConflictException('Only pending payments can be cancelled');
    }
    const updated = await this.payments.transitionStatus(
      id,
      companyId,
      PaymentStatus.PENDING,
      PaymentStatus.CANCELLED,
      {
        statusChangedAt: new Date(),
        statusChangedByUserId: actorUserId,
      },
    );
    if (!updated) {
      throw new ConflictException('Payment is no longer pending');
    }
    return updated;
  }

  async handleWebhook(
    providerPaymentId: string,
    status: PaymentStatus,
    signature?: string,
  ) {
    this.assertWebhookSignature(signature);
    const payment =
      await this.payments.findByProviderPaymentId(providerPaymentId);
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === status) return payment;

    let allowed: PaymentStatus[];
    if (payment.status === PaymentStatus.PENDING) {
      allowed = [
        PaymentStatus.PAID,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
      ];
    } else if (payment.status === PaymentStatus.PAID) {
      allowed = [PaymentStatus.REFUNDED];
    } else {
      allowed = [];
    }

    if (!allowed.includes(status))
      throw new ConflictException('Invalid payment transition');
    return this.payments.update(payment.id, {
      status,
      paidAt: status === PaymentStatus.PAID ? new Date() : undefined,
    });
  }

  private async getOwnedPayment(
    id: string,
    companyId: string,
  ): Promise<Payment> {
    const payment = await this.payments.findById(id);
    if (!payment?.companyId || payment.companyId !== companyId)
      throw new NotFoundException('Payment not found');
    return payment;
  }

  private async assertNotPaid(sourceType: PaymentSourceType, sourceId: string) {
    if (await this.payments.findPaid(sourceType, sourceId)) {
      throw new ConflictException(
        'This concept already has a confirmed payment',
      );
    }
  }

  private async resolveSource(
    sourceType: PaymentSourceType,
    sourceId: string,
    companyId: string,
  ) {
    if (sourceType === PaymentSourceType.APPOINTMENT) {
      const appointment = await this.appointments.findById(sourceId);
      if (!appointment?.companyId || appointment.companyId !== companyId)
        throw new NotFoundException('Appointment not found');
      const client = await this.clients.findById(appointment.clientId);
      if (!client?.companyId || client.companyId !== companyId)
        throw new NotFoundException('Client not found');
      return { clientId: appointment.clientId, description: appointment.title };
    }

    const clientProduct = await this.clientProducts.findById(sourceId);
    if (!clientProduct) throw new NotFoundException('Client product not found');
    const client = await this.clients.findById(clientProduct.clientId);
    const product = await this.products.findById(clientProduct.productId);
    if (
      !client ||
      client?.companyId !== companyId ||
      !product ||
      product?.companyId !== companyId
    ) {
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
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new ForbiddenException('Invalid webhook signature');
    }
  }
}
