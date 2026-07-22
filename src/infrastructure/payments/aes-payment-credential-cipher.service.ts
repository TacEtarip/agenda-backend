import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { IPaymentCredentialCipher } from '@domain/ports/payment-credential-cipher.interface';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

@Injectable()
export class AesPaymentCredentialCipherService implements IPaymentCredentialCipher {
  private readonly key: Buffer | null;

  constructor(config: ConfigService) {
    const encodedKey = config.get<string>(
      'PAYMENT_CREDENTIAL_ENCRYPTION_KEY',
      '',
    );
    const decodedKey = encodedKey ? Buffer.from(encodedKey, 'base64') : null;
    this.key = decodedKey?.length === 32 ? decodedKey : null;
  }

  isConfigured(): boolean {
    return this.key !== null;
  }

  encrypt(value: string, context: string): string {
    const key = this.getKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from(context));
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return [
      VERSION,
      iv.toString('base64url'),
      tag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');
  }

  decrypt(value: string, context: string): string {
    const key = this.getKey();
    const [version, encodedIv, encodedTag, encodedValue] = value.split(':');
    if (version !== VERSION || !encodedIv || !encodedTag || !encodedValue) {
      throw new Error('Unsupported encrypted payment credential format');
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(encodedIv, 'base64url'),
    );
    decipher.setAAD(Buffer.from(context));
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(encodedValue, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  private getKey(): Buffer {
    if (!this.key) {
      throw new Error('Payment credential encryption is not configured');
    }
    return this.key;
  }
}
