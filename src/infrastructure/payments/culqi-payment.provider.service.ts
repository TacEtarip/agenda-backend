import { Injectable, Logger } from '@nestjs/common';
import {
  IPaymentProvider,
  PaymentIntent,
  PaymentProviderCredentials,
  PaymentStatus,
} from '@domain/ports/payment.provider.interface';

@Injectable()
export class CulqiPaymentProviderService implements IPaymentProvider {
  private readonly logger = new Logger(CulqiPaymentProviderService.name);

  async createPaymentIntent(
    credentials: PaymentProviderCredentials,
    amount: number,
    currency: string,
    description: string,
    internalReferenceId: string,
  ): Promise<PaymentIntent> {
    this.logger.log(
      `Creando intento de pago Culqi ${this.environment(credentials.publicKey)} (${currency} ${amount}) para la ref: ${internalReferenceId}`,
    );
    void description;
    void credentials.privateKey;

    // La llamada real a Culqi se conectará aquí usando las credenciales
    // ya resueltas para la empresa propietaria del cobro.
    const mockPaymentId = `pay_test_${Math.random().toString(36).substring(7)}`;

    return {
      id: mockPaymentId,
      checkoutUrl: `https://checkout.sandbox.pasarela.pe/pay/${mockPaymentId}`,
    };
  }

  async verifyPaymentStatus(
    credentials: PaymentProviderCredentials,
    paymentId: string,
  ): Promise<PaymentStatus> {
    this.logger.log(`Verificando estado del pago: ${paymentId}`);
    void credentials.privateKey;

    // La consulta real del estado a Culqi se conectará en esta operación.
    return 'PAID';
  }

  private environment(publicKey: string): string {
    return publicKey.startsWith('pk_live_') ? 'live' : 'test';
  }
}
