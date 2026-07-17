import {
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { GoogleIntegrationService } from '@application/services/google-integration.service';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';
import { GoogleCalendarInboundSyncService } from '@application/services/google-calendar-inbound-sync.service';

@Controller('integrations/google')
export class GoogleIntegrationController {
  private readonly logger = new Logger(GoogleIntegrationController.name);

  constructor(
    private readonly googleIntegration: GoogleIntegrationService,
    private readonly inboundSync: GoogleCalendarInboundSyncService,
    private readonly config: ConfigService,
  ) {}

  @Post('webhook')
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(
    @Headers('x-goog-channel-id') channelId?: string,
    @Headers('x-goog-resource-id') resourceId?: string,
    @Headers('x-goog-resource-state') resourceState?: string,
    @Headers('x-goog-channel-token') token?: string,
  ): Promise<void> {
    await this.inboundSync.handleNotification({
      channelId,
      resourceId,
      resourceState,
      token,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('status')
  status(@CurrentUser() user: AuthenticatedUser) {
    return this.googleIntegration.getStatus(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('authorization-url')
  authorizationUrl(@CurrentUser() user: AuthenticatedUser) {
    return this.googleIntegration.createAuthorizationUrl(user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  disconnect(@CurrentUser() user: AuthenticatedUser) {
    return this.googleIntegration.disconnect(user);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    if (error) {
      try {
        await this.googleIntegration.discardState(state);
      } catch (discardError) {
        this.logger.warn(
          'Could not discard the rejected Google OAuth state',
          discardError,
        );
      }
      response.redirect(
        this.frontendRedirect(
          'error',
          error === 'access_denied' ? 'access_denied' : 'oauth_failed',
        ),
      );
      return;
    }
    try {
      await this.googleIntegration.handleCallback(code || '', state || '');
      response.redirect(this.frontendRedirect('connected'));
    } catch (callbackError) {
      this.logger.error('Google OAuth callback failed', callbackError);
      response.redirect(this.frontendRedirect('error', 'oauth_failed'));
    }
  }

  private frontendRedirect(status: string, reason?: string): string {
    const configured = this.config.get<string>(
      'GOOGLE_FRONTEND_REDIRECT_URL',
      'http://localhost:4200/settings',
    );
    const url = new URL(configured);
    url.searchParams.set('google', status);
    if (reason) url.searchParams.set('reason', reason);
    return url.toString();
  }
}
