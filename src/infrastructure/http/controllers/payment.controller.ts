import {
  Controller,
  Post,
  Body,
  UseGuards,
  Inject,
  Logger,
} from '@nestjs/common';
import {
  PAYMENT_PROVIDER,
  PaymentIntent,
} from '@domain/ports/payment.provider.interface';
import type { IPaymentProvider } from '@domain/ports/payment.provider.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateAppointmentPaymentDto } from '../dtos/payment/create-appointment-payment.dto';
import { PaymentWebhookDto } from '../dtos/payment/payment-webhook.dto';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
  ) {}

  // Endpoint para que el profesional genere un link de cobro rápido para su paciente
  @UseGuards(JwtAuthGuard)
  @Post('create-appointment-payment')
  async createAppointmentPayment(
    @Body() body: CreateAppointmentPaymentDto,
  ): Promise<PaymentIntent> {
    // Generamos un link para que el paciente pague la cita por Yape/Tarjeta
    return this.paymentProvider.createPaymentIntent(
      body.amount,
      'PEN',
      body.description || 'Reserva de Cita',
      body.appointmentId,
    );
  }

  // Webhook para que la Pasarela avise cuando el PACIENTE haya pagado
  @Post('webhook')
  async handleWebhook(@Body() payload: PaymentWebhookDto) {
    // Buscaríamos cita usando payload.internalReferenceId para marcarla "PAGADA"
    this.logger.log(
      `Payment webhook received: reference=${payload.internalReferenceId ?? 'unknown'} status=${payload.status ?? 'unknown'}`,
    );
    return { received: true };
  }
}
