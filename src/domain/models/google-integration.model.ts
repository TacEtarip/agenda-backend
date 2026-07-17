export class GoogleIntegration {
  id!: string;
  userId!: string;
  companyId!: string;
  googleSubject!: string;
  email!: string;
  accessTokenEncrypted!: string;
  refreshTokenEncrypted?: string;
  scope!: string;
  tokenType!: string;
  expiresAt?: Date;
  calendarId!: string;
  calendarSyncToken?: string;
  webhookChannelId?: string;
  webhookResourceId?: string;
  webhookTokenHash?: string;
  webhookExpiresAt?: Date;
  inboundSyncedAt?: Date;
  inboundSyncError?: string;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(partial: Partial<GoogleIntegration>) {
    Object.assign(this, partial);
  }
}

export interface GoogleOAuthState {
  userId: string;
  companyId: string;
  expiresAt: Date;
}
