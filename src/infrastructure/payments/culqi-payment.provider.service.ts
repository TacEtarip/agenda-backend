import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentProvider,
  PaymentIntent,
  PaymentStatus,
} from '@domain/ports/payment.provider.interface';

@Injectable()
export class CulqiPaymentProviderService implements IPaymentProvider {
  private readonly logger = new Logger(CulqiPaymentProviderService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    // Tomamos la llave de Culqi o MercadoPago desde las variables de entorno
    this.apiKey = this.configService.get<string>(
      'PAYMENT_API_KEY',
      'default_test_key',
    );
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    description: string,
    internalReferenceId: string,
  ): Promise<PaymentIntent> {
    this.logger.log(
      `Creando intento de pago en pasarela local (S/ ${amount}) para la ref: ${internalReferenceId}`,
    );

    // Aquí iría la llamada HTTP real a la API de Culqi o MercadoPago
    // Simulator para modo desarrollo:
    const mockPaymentId = `pay_test_${Math.random().toString(36).substring(7)}`;

    return {
      id: mockPaymentId,
      checkoutUrl: `https://checkout.sandbox.pasarela.pe/pay/${mockPaymentId}`,
    };
  }

  async verifyPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    this.logger.log(`Verificando estado del pago: ${paymentId}`);

    // Aquí consultarías a la API real para ver si el pago por Yape/Plin fue concretado
    return 'PAID'; // Simulado como pagado
  }
}
