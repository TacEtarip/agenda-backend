import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import {
  GOOGLE_OAUTH_SCOPES,
  GoogleOAuthTokens,
  GoogleUserInfo,
  IGoogleOAuthProvider,
} from '@domain/ports/google-oauth.provider.interface';

@Injectable()
export class GoogleOAuthProviderService implements IGoogleOAuthProvider {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('GOOGLE_CLIENT_ID', '');
    this.clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET', '');
    this.redirectUri = this.config.get<string>('GOOGLE_REDIRECT_URI', '');
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.redirectUri);
  }

  getAuthorizationUrl(state: string, loginHint?: string): string {
    return this.createClient().generateAuthUrl({
      access_type: 'offline',
      include_granted_scopes: true,
      prompt: 'consent',
      response_type: 'code',
      scope: [...GOOGLE_OAUTH_SCOPES],
      state,
      login_hint: loginHint,
    });
  }

  async exchangeCode(code: string): Promise<GoogleOAuthTokens> {
    const { tokens } = await this.createClient().getToken(code);
    if (!tokens.access_token) {
      throw new Error('Google did not return an access token');
    }
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      scope: tokens.scope ?? undefined,
      tokenType: tokens.token_type ?? undefined,
      expiryDate: tokens.expiry_date ?? undefined,
    };
  }

  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    const client = this.createClient();
    client.setCredentials({ access_token: accessToken });
    const { data } = await google
      .oauth2({ version: 'v2', auth: client })
      .userinfo.get();
    if (!data.id || !data.email) {
      throw new Error('Google did not return the required user identity');
    }
    return {
      subject: data.id,
      email: data.email,
      emailVerified: Boolean(data.verified_email),
    };
  }

  async revokeToken(token: string): Promise<void> {
    await this.createClient().revokeToken(token);
  }

  private createClient() {
    return new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
  }
}
