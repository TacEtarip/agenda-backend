import { BadRequestException } from '@nestjs/common';
import { GoogleIntegration } from '@domain/models/google-integration.model';
import type { IGoogleIntegrationRepository } from '@domain/ports/google-integration.repository.interface';
import type { IGoogleOAuthProvider } from '@domain/ports/google-oauth.provider.interface';
import type { ITokenCipher } from '@domain/ports/token-cipher.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';
import { GoogleIntegrationService } from './google-integration.service';

describe('GoogleIntegrationService', () => {
  const user: AuthenticatedUser = {
    userId: 'user-1',
    companyId: 'company-1',
    email: 'owner@example.com',
  };

  const connection = new GoogleIntegration({
    id: 'integration-1',
    userId: user.userId,
    companyId: user.companyId,
    googleSubject: 'google-subject-1',
    email: 'owner@gmail.com',
    accessTokenEncrypted: 'encrypted-access',
    refreshTokenEncrypted: 'encrypted-refresh',
    scope: 'openid email https://www.googleapis.com/auth/calendar.events',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 3_600_000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const setup = () => {
    const integrations = {
      findByUserId: jest.fn().mockResolvedValue(null),
      findByGoogleSubject: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(connection),
      deleteByUserId: jest.fn().mockResolvedValue(undefined),
      createState: jest.fn().mockResolvedValue(undefined),
      consumeState: jest.fn().mockResolvedValue(null),
    } as jest.Mocked<IGoogleIntegrationRepository>;
    const google = {
      isConfigured: jest.fn().mockReturnValue(true),
      getAuthorizationUrl: jest
        .fn()
        .mockReturnValue('https://accounts.google.test/auth'),
      exchangeCode: jest.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        scope: 'openid email https://www.googleapis.com/auth/calendar.events',
        tokenType: 'Bearer',
        expiryDate: Date.now() + 3_600_000,
      }),
      getUserInfo: jest.fn().mockResolvedValue({
        subject: connection.googleSubject,
        email: connection.email,
        emailVerified: true,
      }),
      revokeToken: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IGoogleOAuthProvider>;
    const cipher = {
      isConfigured: jest.fn().mockReturnValue(true),
      encrypt: jest.fn((value: string) => `encrypted:${value}`),
      decrypt: jest.fn().mockReturnValue('refresh-token'),
    } as jest.Mocked<ITokenCipher>;
    const users = {
      findByGoogleId: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: user.userId }),
    } as unknown as jest.Mocked<IUserRepository>;
    const service = new GoogleIntegrationService(
      integrations,
      google,
      cipher,
      users,
    );
    return { service, integrations, google, cipher, users };
  };

  it('creates a one-time authorization state and returns the Google URL', async () => {
    const { service, integrations, google } = setup();

    const result = await service.createAuthorizationUrl(user);

    expect(result.url).toBe('https://accounts.google.test/auth');
    expect(integrations.createState).toHaveBeenCalledWith(
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.objectContaining({
        userId: user.userId,
        companyId: user.companyId,
        expiresAt: expect.any(Date),
      }),
    );
    expect(google.getAuthorizationUrl).toHaveBeenCalledWith(
      expect.any(String),
      user.email,
    );
  });

  it('exchanges a valid callback and stores encrypted tokens', async () => {
    const { service, integrations, cipher, users } = setup();
    integrations.consumeState.mockResolvedValue({
      userId: user.userId,
      companyId: user.companyId!,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await service.handleCallback('authorization-code', 'valid-state');

    expect(cipher.encrypt).toHaveBeenCalledWith(
      'access-token',
      `google:${user.userId}`,
    );
    expect(cipher.encrypt).toHaveBeenCalledWith(
      'refresh-token',
      `google:${user.userId}`,
    );
    expect(integrations.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.userId,
        companyId: user.companyId,
        googleSubject: connection.googleSubject,
        email: connection.email,
      }),
    );
    expect(users.update).toHaveBeenCalledWith(
      user.userId,
      expect.objectContaining({
        googleId: connection.googleSubject,
        integrationProvider: 'google',
        syncCalendar: true,
      }),
    );
  });

  it('rejects an expired authorization state before exchanging the code', async () => {
    const { service, integrations, google } = setup();
    integrations.consumeState.mockResolvedValue({
      userId: user.userId,
      companyId: user.companyId!,
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(
      service.handleCallback('authorization-code', 'expired-state'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(google.exchangeCode).not.toHaveBeenCalled();
  });

  it('rejects a callback without Google Calendar permission', async () => {
    const { service, integrations, google } = setup();
    integrations.consumeState.mockResolvedValue({
      userId: user.userId,
      companyId: user.companyId!,
      expiresAt: new Date(Date.now() + 60_000),
    });
    google.exchangeCode.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      scope: 'openid email',
    });

    await expect(
      service.handleCallback('authorization-code', 'valid-state'),
    ).rejects.toThrow('Google Calendar permission was not granted');
    expect(integrations.upsert).not.toHaveBeenCalled();
  });

  it('does not reuse an old refresh token for a different Google account', async () => {
    const { service, integrations, google } = setup();
    integrations.consumeState.mockResolvedValue({
      userId: user.userId,
      companyId: user.companyId!,
      expiresAt: new Date(Date.now() + 60_000),
    });
    integrations.findByUserId.mockResolvedValue(connection);
    google.exchangeCode.mockResolvedValue({
      accessToken: 'new-access-token',
      scope: 'openid email https://www.googleapis.com/auth/calendar.events',
    });
    google.getUserInfo.mockResolvedValue({
      subject: 'different-google-subject',
      email: 'different@gmail.com',
      emailVerified: true,
    });

    await expect(
      service.handleCallback('authorization-code', 'valid-state'),
    ).rejects.toThrow('Google did not return offline access for Calendar');
    expect(integrations.upsert).not.toHaveBeenCalled();
  });

  it('revokes the refresh token and removes the local connection', async () => {
    const { service, integrations, google, cipher, users } = setup();
    integrations.findByUserId.mockResolvedValueOnce(connection);

    const result = await service.disconnect(user);

    expect(cipher.decrypt).toHaveBeenCalledWith(
      connection.refreshTokenEncrypted,
      `google:${user.userId}`,
    );
    expect(google.revokeToken).toHaveBeenCalledWith('refresh-token');
    expect(integrations.deleteByUserId).toHaveBeenCalledWith(user.userId);
    expect(users.update).toHaveBeenCalledWith(user.userId, {
      googleId: null,
      integrationProvider: 'none',
      syncCalendar: false,
    });
    expect(result.connected).toBe(false);
  });
});
