export const GOOGLE_OAUTH_PROVIDER = 'GOOGLE_OAUTH_PROVIDER';

export const GOOGLE_OAUTH_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events',
] as const;

export interface GoogleOAuthTokens {
  accessToken: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  expiryDate?: number;
}

export interface GoogleUserInfo {
  subject: string;
  email: string;
  emailVerified: boolean;
}

export interface IGoogleOAuthProvider {
  isConfigured(): boolean;
  getAuthorizationUrl(state: string, loginHint?: string): string;
  exchangeCode(code: string): Promise<GoogleOAuthTokens>;
  getUserInfo(accessToken: string): Promise<GoogleUserInfo>;
  revokeToken(token: string): Promise<void>;
}
