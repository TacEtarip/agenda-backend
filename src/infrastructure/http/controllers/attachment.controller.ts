import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AttachmentService } from '@application/services/attachment.service';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { CreateAttachmentDto } from '../dtos/attachment/create-attachment.dto';

@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post()
  create(@Body() dto: CreateAttachmentDto) {
    return this.attachmentService.createAttachment(dto);
  }

  @Get('client/:clientId')
  findAllByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.attachmentService.getAttachmentsByClient(clientId);
  }

  @Get('note/:noteId')
  findAllByNote(@Param('noteId', ParseUUIDPipe) noteId: string) {
    return this.attachmentService.getAttachmentsByNote(noteId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attachmentService.getAttachmentById(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.attachmentService.deleteAttachment(id);
  }
}
