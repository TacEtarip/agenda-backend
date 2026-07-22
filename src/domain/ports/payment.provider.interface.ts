export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface PaymentIntent {
  id: string;
  checkoutUrl: string; // URL a la que Angular redirigirá para pagar con Yape/Plin/Tarjeta
}

export interface PaymentProviderCredentials {
  publicKey: string;
  privateKey: string;
}

export interface IPaymentProvider {
  /**
   * Genera un intento de pago y devuelve la URL para cobrar
   * @param amount Monto a cobrar (ej. 50.00)
   * @param currency Moneda (ej. 'PEN' para Soles)
   * @param description Descripción del cobro
   * @param internalReferenceId ID interno de tu BD (ej. id de la suscripción o usuario)
   */
  createPaymentIntent(
    credentials: PaymentProviderCredentials,
    amount: number,
    currency: string,
    description: string,
    internalReferenceId: string,
  ): Promise<PaymentIntent>;

  /**
   * Verifica el estado final de un pago (útil para webhooks o comprobación manual)
   * @param paymentId El ID externo de la pasarela
   */
  verifyPaymentStatus(
    credentials: PaymentProviderCredentials,
    paymentId: string,
  ): Promise<PaymentStatus>;
}
