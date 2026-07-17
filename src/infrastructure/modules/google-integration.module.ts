import { Module } from '@nestjs/common';
import { GoogleIntegrationService } from '@application/services/google-integration.service';
import { GOOGLE_OAUTH_PROVIDER } from '@domain/ports/google-oauth.provider.interface';
import { TOKEN_CIPHER } from '@domain/ports/token-cipher.interface';
import { GOOGLE_CALENDAR_PROVIDER } from '@domain/ports/google-calendar.provider.interface';
import { AesTokenCipherService } from '../auth/aes-token-cipher.service';
import { GoogleOAuthProviderService } from '../auth/google-oauth.provider.service';
import { GoogleCalendarProviderService } from '../calendar/google-calendar.provider.service';
import { DatabaseModule } from '../database/database.module';
import { GoogleIntegrationController } from '../http/controllers/google-integration.controller';
import { GoogleCalendarInboundSyncService } from '@application/services/google-calendar-inbound-sync.service';
import { AppointmentAvailabilityService } from '@application/services/appointment-availability.service';
import { AppointmentScheduleConflictService } from '@application/services/appointment-schedule-conflict.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GoogleIntegrationController],
  providers: [
    GoogleIntegrationService,
    GoogleCalendarInboundSyncService,
    AppointmentAvailabilityService,
    AppointmentScheduleConflictService,
    GoogleOAuthProviderService,
    GoogleCalendarProviderService,
    AesTokenCipherService,
    {
      provide: GOOGLE_OAUTH_PROVIDER,
      useExisting: GoogleOAuthProviderService,
    },
    {
      provide: TOKEN_CIPHER,
      useExisting: AesTokenCipherService,
    },
    {
      provide: GOOGLE_CALENDAR_PROVIDER,
      useExisting: GoogleCalendarProviderService,
    },
  ],
  exports: [
    GoogleIntegrationService,
    GoogleCalendarInboundSyncService,
    AppointmentAvailabilityService,
    AppointmentScheduleConflictService,
    GOOGLE_CALENDAR_PROVIDER,
    TOKEN_CIPHER,
  ],
})
export class GoogleIntegrationModule {}
