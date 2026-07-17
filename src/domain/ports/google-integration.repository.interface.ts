import {
  GoogleIntegration,
  GoogleOAuthState,
} from '../models/google-integration.model';

export const GOOGLE_INTEGRATION_REPOSITORY = 'GOOGLE_INTEGRATION_REPOSITORY';

export interface IGoogleIntegrationRepository {
  findByUserId(userId: string): Promise<GoogleIntegration | null>;
  findByGoogleSubject(googleSubject: string): Promise<GoogleIntegration | null>;
  findByWebhookChannelId(channelId: string): Promise<GoogleIntegration | null>;
  findAll(): Promise<GoogleIntegration[]>;
  upsert(
    integration: Partial<GoogleIntegration> &
      Pick<
        GoogleIntegration,
        'userId' | 'companyId' | 'googleSubject' | 'email'
      >,
  ): Promise<GoogleIntegration>;
  deleteByUserId(userId: string): Promise<void>;
  updateTokens(
    userId: string,
    tokens: {
      accessTokenEncrypted: string;
      refreshTokenEncrypted?: string;
      expiresAt?: Date;
    },
  ): Promise<void>;
  updateCalendarSync(
    userId: string,
    data: {
      calendarId?: string;
      calendarSyncToken?: string | null;
      webhookChannelId?: string | null;
      webhookResourceId?: string | null;
      webhookTokenHash?: string | null;
      webhookExpiresAt?: Date | null;
      inboundSyncedAt?: Date | null;
      inboundSyncError?: string | null;
    },
  ): Promise<void>;
  createState(stateHash: string, state: GoogleOAuthState): Promise<void>;
  consumeState(stateHash: string): Promise<GoogleOAuthState | null>;
}
