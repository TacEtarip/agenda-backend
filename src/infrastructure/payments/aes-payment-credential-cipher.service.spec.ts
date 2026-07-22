import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { AesPaymentCredentialCipherService } from './aes-payment-credential-cipher.service';

describe('AesPaymentCredentialCipherService', () => {
  const createCipher = () =>
    new AesPaymentCredentialCipherService(
      new ConfigService({
        PAYMENT_CREDENTIAL_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
      }),
    );

  it('encrypts a credential for one company context', () => {
    const cipher = createCipher();
    const encrypted = cipher.encrypt(
      'sk_test_secret',
      'culqi:company-1:private-key',
    );

    expect(encrypted).not.toContain('sk_test_secret');
    expect(cipher.decrypt(encrypted, 'culqi:company-1:private-key')).toBe(
      'sk_test_secret',
    );
  });

  it('does not decrypt a credential for another company', () => {
    const cipher = createCipher();
    const encrypted = cipher.encrypt(
      'sk_test_secret',
      'culqi:company-1:private-key',
    );

    expect(() =>
      cipher.decrypt(encrypted, 'culqi:company-2:private-key'),
    ).toThrow();
  });
});
