import { randomBytes } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { AesTokenCipherService } from './aes-token-cipher.service';

describe('AesTokenCipherService', () => {
  const createCipher = () =>
    new AesTokenCipherService(
      new ConfigService({
        GOOGLE_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
      }),
    );

  it('encrypts and decrypts a token in the same user context', () => {
    const cipher = createCipher();

    const encrypted = cipher.encrypt('secret-token', 'google:user-1');

    expect(encrypted).not.toContain('secret-token');
    expect(cipher.decrypt(encrypted, 'google:user-1')).toBe('secret-token');
  });

  it('does not decrypt a token in a different user context', () => {
    const cipher = createCipher();
    const encrypted = cipher.encrypt('secret-token', 'google:user-1');

    expect(() => cipher.decrypt(encrypted, 'google:user-2')).toThrow();
  });
});
