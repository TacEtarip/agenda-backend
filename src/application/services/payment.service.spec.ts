import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '@domain/enums/payment-method.enum';
import { PaymentOrigin } from '@domain/enums/payment-origin.enum';
import { PaymentSourceType } from '@domain/enums/payment-source-type.enum';
import { PaymentStatus } from '@domain/enums/payment-status.enum';
import { Payment } from '@domain/models/payment.model';
import type { IPaymentRepository } from '@domain/ports/payment.repository.interface';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  const appointment = {
    id: 'appointment-1',
    companyId: 'company-1',
    clientId: 'client-1',
    title: 'Consulta',
  };
  const client = { id: 'client-1', companyId: 'company-1' };

  const createPayment = (partial: Partial<Payment> = {}) =>
    new Payment({
      id: 'payment-1',
      companyId: 'company-1',
      clientId: 'client-1',
      appointmentId: 'appointment-1',
      sourceType: PaymentSourceType.APPOINTMENT,
      sourceId: 'appointment-1',
      amount: 80,
      currency: 'PEN',
      description: 'Consulta',
      status: PaymentStatus.PENDING,
      origin: PaymentOrigin.PAYMENT_LINK,
      method: PaymentMethod.ONLINE,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...partial,
    });

  const setup = () => {
    const payments = {
      create: jest.fn(async (data: Partial<Payment>) => createPayment(data)),
      findById: jest.fn(),
      findByProviderPaymentId: jest.fn(),
      findBySource: jest.fn(),
      findActivePending: jest.fn(),
      findPaid: jest.fn().mockResolvedValue(null),
      findAll: jest.fn(),
      update: jest.fn(async (id: string, data: Partial<Payment>) => createPayment({ id, ...data })),
      cancelPendingForSource: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IPaymentRepository>;
    const appointments = { findById: jest.fn().mockResolvedValue(appointment) };
    const clientProducts = { findById: jest.fn() };
    const clients = { findById: jest.fn().mockResolvedValue(client) };
    const products = { findById: jest.fn() };
    const provider = {
      createPaymentIntent: jest.fn().mockResolvedValue({ id: 'provider-1', checkoutUrl: 'https://pay.test/1' }),
      verifyPaymentStatus: jest.fn(),
    };
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new PaymentService(
      payments,
      appointments as never,
      clientProducts as never,
      clients as never,
      products as never,
      provider,
      config,
    );
    return { service, payments, provider };
  };

  it('creates an independent payment link and stores the provider result', async () => {
    const { service, payments, provider } = setup();

    const result = await service.createLink(
      { sourceType: PaymentSourceType.APPOINTMENT, sourceId: appointment.id, amount: 80 },
      'company-1',
    );

    expect(payments.cancelPendingForSource).toHaveBeenCalledWith(PaymentSourceType.APPOINTMENT, appointment.id);
    expect(provider.createPaymentIntent).toHaveBeenCalledWith(80, 'PEN', 'Consulta', 'payment-1');
    expect(result.checkoutUrl).toBe('https://pay.test/1');
  });

  it('prevents a second confirmed payment for the same source', async () => {
    const { service, payments } = setup();
    payments.findPaid.mockResolvedValue(createPayment({ status: PaymentStatus.PAID }));

    await expect(service.registerManual({
      sourceType: PaymentSourceType.APPOINTMENT,
      sourceId: appointment.id,
      amount: 80,
      method: PaymentMethod.CASH,
      paidAt: new Date(),
    }, 'company-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('handles duplicate webhook notifications idempotently', async () => {
    const { service, payments } = setup();
    payments.findByProviderPaymentId.mockResolvedValue(createPayment({
      status: PaymentStatus.PAID,
      providerPaymentId: 'provider-1',
    }));

    const result = await service.handleWebhook('provider-1', PaymentStatus.PAID);

    expect(result.status).toBe(PaymentStatus.PAID);
    expect(payments.update).not.toHaveBeenCalled();
  });
});
