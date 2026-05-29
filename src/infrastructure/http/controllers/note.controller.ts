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
  Put,
  UseGuards,
} from '@nestjs/common';
import { NoteService } from '@application/services/note.service';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@infrastructure/auth/strategies/jwt.strategy';
import { CreateNoteDto } from '../dtos/note/create-note.dto';
import { UpdateNoteDto } from '../dtos/note/update-note.dto';

import { Note } from '@domain/models/note.model';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  create(
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Note> {
    return this.noteService.createNote({
      ...dto,
      companyId: user.companyId,
    });
  }

  @Get('client/:clientId')
  findAllByClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Note[]> {
    return this.noteService.getNotesByClient(clientId, user.companyId || '');
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<Note> {
    return this.noteService.getNoteById(id, user.companyId || '');
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Note> {
    return this.noteService.updateNote(id, dto, user.companyId || '');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.noteService.deleteNote(id, user.companyId || '');
  }
}
