import { Module } from '@nestjs/common';
import { AttachmentService } from '@application/services/attachment.service';
import { AttachmentController } from '../http/controllers/attachment.controller';

@Module({
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService],
})
export class AttachmentModule {}
