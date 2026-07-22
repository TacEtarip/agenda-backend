import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const requiredConfig = {
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_USER: 'agenda',
    DB_PASSWORD: 'secret',
    DB_NAME: 'agenda',
    JWT_SECRET: 'test-secret',
  };

  it('allows Google OAuth to remain disabled', () => {
    expect(validateEnv({ ...requiredConfig })).toEqual(requiredConfig);
  });

  it('rejects a partial Google OAuth configuration', () => {
    expect(() =>
      validateEnv({
        ...requiredConfig,
        GOOGLE_CLIENT_ID: 'client-id',
      }),
    ).toThrow('Google OAuth configuration must define all of');
  });

  it('accepts a complete Google OAuth configuration', () => {
    const config = {
      ...requiredConfig,
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:3000/integrations/google/callback',
      GOOGLE_FRONTEND_REDIRECT_URL: 'http://localhost:4200/settings',
      GOOGLE_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
    };

    expect(validateEnv(config)).toEqual(config);
  });

  it('rejects an invalid Google token encryption key', () => {
    expect(() =>
      validateEnv({
        ...requiredConfig,
        GOOGLE_CLIENT_ID: 'client-id',
        GOOGLE_CLIENT_SECRET: 'client-secret',
        GOOGLE_REDIRECT_URI:
          'http://localhost:3000/integrations/google/callback',
        GOOGLE_FRONTEND_REDIRECT_URL: 'http://localhost:4200/settings',
        GOOGLE_TOKEN_ENCRYPTION_KEY: 'not-a-32-byte-key',
      }),
    ).toThrow(
      'GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key',
    );
  });

  it('accepts a valid payment credential encryption key', () => {
    const config = {
      ...requiredConfig,
      PAYMENT_CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString('base64'),
    };

    expect(validateEnv(config)).toEqual(config);
  });

  it('rejects an invalid payment credential encryption key', () => {
    expect(() =>
      validateEnv({
        ...requiredConfig,
        PAYMENT_CREDENTIAL_ENCRYPTION_KEY: 'invalid-key',
      }),
    ).toThrow(
      'PAYMENT_CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key',
    );
  });
});
