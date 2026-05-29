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
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@infrastructure/auth/strategies/jwt.strategy';
import { CreateAttachmentDto } from '../dtos/attachment/create-attachment.dto';
import { Attachment } from '@domain/models/attachment.model';

@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post()
  create(
    @Body() dto: CreateAttachmentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Attachment> {
    return this.attachmentService.createAttachment({
      ...dto,
      companyId: user.companyId,
    });
  }

  @Get('client/:clientId')
  findAllByClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Attachment[]> {
    return this.attachmentService.getAttachmentsByClient(
      clientId,
      user.companyId || '',
    );
  }

  @Get('note/:noteId')
  findAllByNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Attachment[]> {
    return this.attachmentService.getAttachmentsByNote(
      noteId,
      user.companyId || '',
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Attachment> {
    return this.attachmentService.getAttachmentById(id, user.companyId || '');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.attachmentService.deleteAttachment(id, user.companyId || '');
  }
}
