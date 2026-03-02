import { Module } from '@nestjs/common';
import { MessageTemplateController } from '../http/controllers/message-template.controller';
import { MessageTemplateService } from '@application/services/message-template.service';

@Module({
  controllers: [MessageTemplateController],
  providers: [MessageTemplateService],
  exports: [MessageTemplateService],
})
export class MessageTemplateModule {}
