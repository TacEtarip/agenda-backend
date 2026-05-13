import { Module, Global } from '@nestjs/common';
import { MESSAGING_PROVIDER } from '@domain/ports/messaging.provider.interface';
import { WhatsAppWebProviderService } from './whatsapp-web.provider.service';
import { WhatsAppController } from '../http/controllers/whatsapp.controller';

@Global()
@Module({
  controllers: [WhatsAppController],
  providers: [
    {
      provide: MESSAGING_PROVIDER,
      useClass: WhatsAppWebProviderService,
    },
  ],
  exports: [MESSAGING_PROVIDER],
})
export class MessagingModule {}
