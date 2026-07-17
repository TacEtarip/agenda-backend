import { createHash, randomBytes } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GOOGLE_INTEGRATION_REPOSITORY } from '@domain/ports/google-integration.repository.interface';
import type { IGoogleIntegrationRepository } from '@domain/ports/google-integration.repository.interface';
import {
  GOOGLE_OAUTH_PROVIDER,
  GOOGLE_OAUTH_SCOPES,
} from '@domain/ports/google-oauth.provider.interface';
import type { IGoogleOAuthProvider } from '@domain/ports/google-oauth.provider.interface';
import { TOKEN_CIPHER } from '@domain/ports/token-cipher.interface';
import type { ITokenCipher } from '@domain/ports/token-cipher.interface';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';

const STATE_TTL_MS = 10 * 60 * 1000;
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export interface GoogleIntegrationStatus {
  configured: boolean;
  connected: boolean;
  email?: string;
  scopes: string[];
  expiresAt?: Date;
}

@Injectable()
export class GoogleIntegrationService {
  private readonly logger = new Logger(GoogleIntegrationService.name);

  constructor(
    @Inject(GOOGLE_INTEGRATION_REPOSITORY)
    private readonly integrations: IGoogleIntegrationRepository,
    @Inject(GOOGLE_OAUTH_PROVIDER)
    private readonly google: IGoogleOAuthProvider,
    @Inject(TOKEN_CIPHER)
    private readonly cipher: ITokenCipher,
    @Inject(USER_REPOSITORY)
    private readonly users: IUserRepository,
  ) {}

  async getStatus(user: AuthenticatedUser): Promise<GoogleIntegrationStatus> {
    const configured = this.isConfigured();
    const integration = await this.integrations.findByUserId(user.userId);
    if (!integration || integration.companyId !== user.companyId) {
      return { configured, connected: false, scopes: [] };
    }
    return {
      configured,
      connected: true,
      email: integration.email,
      scopes: integration.scope.split(' ').filter(Boolean),
      expiresAt: integration.expiresAt,
    };
  }

  async createAuthorizationUrl(
    user: AuthenticatedUser,
  ): Promise<{ url: string }> {
    this.assertConfigured();
    if (!user.companyId) {
      throw new BadRequestException('A company is required to link Google');
    }
    const state = randomBytes(32).toString('base64url');
    await this.integrations.createState(this.hashState(state), {
      userId: user.userId,
      companyId: user.companyId,
      expiresAt: new Date(Date.now() + STATE_TTL_MS),
    });
    return { url: this.google.getAuthorizationUrl(state, user.email) };
  }

  async handleCallback(code: string, state: string): Promise<void> {
    this.assertConfigured();
    if (!code || !state) {
      throw new BadRequestException('Missing Google authorization response');
    }
    const oauthState = await this.integrations.consumeState(
      this.hashState(state),
    );
    if (!oauthState || oauthState.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Invalid or expired Google OAuth state');
    }

    const tokens = await this.google.exchangeCode(code);
    if (
      tokens.scope &&
      !tokens.scope.split(' ').includes(GOOGLE_CALENDAR_SCOPE)
    ) {
      throw new BadRequestException(
        'Google Calendar permission was not granted',
      );
    }
    const identity = await this.google.getUserInfo(tokens.accessToken);
    if (!identity.emailVerified) {
      throw new BadRequestException('Google email is not verified');
    }

    const linkedIntegration = await this.integrations.findByGoogleSubject(
      identity.subject,
    );
    if (linkedIntegration && linkedIntegration.userId !== oauthState.userId) {
      throw new ConflictException(
        'This Google account is already linked to another user',
      );
    }
    const linkedUser = await this.users.findByGoogleId(identity.subject);
    if (linkedUser && linkedUser.id !== oauthState.userId) {
      throw new ConflictException(
        'This Google account is already linked to another user',
      );
    }

    const current = await this.integrations.findByUserId(oauthState.userId);
    const context = this.tokenContext(oauthState.userId);
    const refreshTokenEncrypted = tokens.refreshToken
      ? this.cipher.encrypt(tokens.refreshToken, context)
      : current?.googleSubject === identity.subject
        ? current.refreshTokenEncrypted
        : undefined;
    if (!refreshTokenEncrypted) {
      throw new BadRequestException(
        'Google did not return offline access for Calendar',
      );
    }
    await this.integrations.upsert({
      userId: oauthState.userId,
      companyId: oauthState.companyId,
      googleSubject: identity.subject,
      email: identity.email,
      accessTokenEncrypted: this.cipher.encrypt(tokens.accessToken, context),
      refreshTokenEncrypted,
      scope: tokens.scope || GOOGLE_OAUTH_SCOPES.join(' '),
      tokenType: tokens.tokenType || 'Bearer',
      expiresAt: tokens.expiryDate ? new Date(tokens.expiryDate) : undefined,
    });
    await this.users.update(oauthState.userId, {
      googleId: identity.subject,
      integrationProvider: 'google',
      syncCalendar: true,
    });
  }

  async discardState(state?: string): Promise<void> {
    if (!state) return;
    await this.integrations.consumeState(this.hashState(state));
  }

  async disconnect(user: AuthenticatedUser): Promise<GoogleIntegrationStatus> {
    const integration = await this.integrations.findByUserId(user.userId);
    if (integration && integration.companyId === user.companyId) {
      try {
        const encryptedToken =
          integration.refreshTokenEncrypted || integration.accessTokenEncrypted;
        await this.google.revokeToken(
          this.cipher.decrypt(encryptedToken, this.tokenContext(user.userId)),
        );
      } catch (error) {
        this.logger.warn(
          `Google token revocation failed for user ${user.userId}; removing the local connection`,
          error,
        );
      }
      await this.integrations.deleteByUserId(user.userId);
      await this.users.update(user.userId, {
        googleId: null,
        integrationProvider: 'none',
        syncCalendar: false,
      });
    }
    return this.getStatus(user);
  }

  private isConfigured(): boolean {
    return this.google.isConfigured() && this.cipher.isConfigured();
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Google integration is not configured',
      );
    }
  }

  private hashState(state: string): string {
    return createHash('sha256').update(state).digest('hex');
  }

  private tokenContext(userId: string): string {
    return `google:${userId}`;
  }
}
