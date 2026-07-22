export const PAYMENT_CREDENTIAL_CIPHER = 'PAYMENT_CREDENTIAL_CIPHER';

export interface IPaymentCredentialCipher {
  isConfigured(): boolean;
  encrypt(value: string, context: string): string;
  decrypt(value: string, context: string): string;
}
