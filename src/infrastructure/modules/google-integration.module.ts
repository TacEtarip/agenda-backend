import { Module } from '@nestjs/common';
import { GoogleIntegrationService } from '@application/services/google-integration.service';
import { GOOGLE_OAUTH_PROVIDER } from '@domain/ports/google-oauth.provider.interface';
import { TOKEN_CIPHER } from '@domain/ports/token-cipher.interface';
import { AesTokenCipherService } from '../auth/aes-token-cipher.service';
import { GoogleOAuthProviderService } from '../auth/google-oauth.provider.service';
import { DatabaseModule } from '../database/database.module';
import { GoogleIntegrationController } from '../http/controllers/google-integration.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [GoogleIntegrationController],
  providers: [
    GoogleIntegrationService,
    GoogleOAuthProviderService,
    AesTokenCipherService,
    {
      provide: GOOGLE_OAUTH_PROVIDER,
      useExisting: GoogleOAuthProviderService,
    },
    {
      provide: TOKEN_CIPHER,
      useExisting: AesTokenCipherService,
    },
  ],
  exports: [GoogleIntegrationService],
})
export class GoogleIntegrationModule {}
