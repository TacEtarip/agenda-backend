import { Module } from '@nestjs/common';
import { MessageTemplateController } from '../http/controllers/message-template.controller';
import { MessageTemplateService } from '@application/services/message-template.service';
import { TemplateRendererService } from '@application/services/template-renderer.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MessageTemplateController],
  providers: [MessageTemplateService, TemplateRendererService],
  exports: [MessageTemplateService, TemplateRendererService],
})
export class MessageTemplateModule {}
