type Env = Record<string, string | undefined>;

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
] as const;

const googleEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URI',
  'GOOGLE_FRONTEND_REDIRECT_URL',
  'GOOGLE_TOKEN_ENCRYPTION_KEY',
] as const;

export function validateEnv(config: Env): Env {
  for (const key of requiredEnvVars) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  const dbPort = Number(config.DB_PORT);
  if (!Number.isInteger(dbPort) || dbPort <= 0 || dbPort > 65535) {
    throw new Error('DB_PORT must be a valid TCP port');
  }

  const configuredGoogleVars = googleEnvVars.filter((key) => config[key]);
  if (
    configuredGoogleVars.length > 0 &&
    configuredGoogleVars.length !== googleEnvVars.length
  ) {
    throw new Error(
      `Google OAuth configuration must define all of: ${googleEnvVars.join(', ')}`,
    );
  }
  if (configuredGoogleVars.length === googleEnvVars.length) {
    const encryptionKey = Buffer.from(
      config.GOOGLE_TOKEN_ENCRYPTION_KEY || '',
      'base64',
    );
    if (encryptionKey.length !== 32) {
      throw new Error(
        'GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key',
      );
    }
    for (const key of ['GOOGLE_REDIRECT_URI', 'GOOGLE_FRONTEND_REDIRECT_URL']) {
      try {
        const url = new URL(config[key] || '');
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch {
        throw new Error(`${key} must be a valid HTTP(S) URL`);
      }
    }
    if (config.GOOGLE_CALENDAR_WEBHOOK_URL) {
      try {
        const webhookUrl = new URL(config.GOOGLE_CALENDAR_WEBHOOK_URL);
        if (webhookUrl.protocol !== 'https:') throw new Error();
      } catch {
        throw new Error(
          'GOOGLE_CALENDAR_WEBHOOK_URL must be a valid HTTPS URL',
        );
      }
    }
  }

  const positiveIntegerDefaults = {
    WHATSAPP_MAX_CLIENTS: 5,
    WHATSAPP_QR_TIMEOUT_MS: 300_000,
    WHATSAPP_IDLE_TIMEOUT_MS: 1_800_000,
  } as const;
  for (const [key, defaultValue] of Object.entries(positiveIntegerDefaults)) {
    const rawValue = config[key] ?? String(defaultValue);
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }
  }

  return config;
}
