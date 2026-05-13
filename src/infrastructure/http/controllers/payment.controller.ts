import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import {
  PAYMENT_PROVIDER,
  PaymentIntent,
} from '@domain/ports/payment.provider.interface';
import type { IPaymentProvider } from '@domain/ports/payment.provider.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  constructor(
    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: IPaymentProvider,
  ) {}

  // Endpoint para que el profesional genere un link de cobro rápido para su paciente
  @UseGuards(JwtAuthGuard)
  @Post('create-appointment-payment')
  async createAppointmentPayment(
    @Body()
    body: {
      appointmentId: string;
      amount: number;
      description: string;
    },
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
  async handleWebhook(@Body() payload: any) {
    // Buscaríamos cita usando payload.internalReferenceId para marcarla "PAGADA"
    console.log('Webhook de pago de paciente recibido:', payload);
    return { received: true };
  }
}
