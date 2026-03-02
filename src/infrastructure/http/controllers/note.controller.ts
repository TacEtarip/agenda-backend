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
import { CreateNoteDto } from '../dtos/note/create-note.dto';
import { UpdateNoteDto } from '../dtos/note/update-note.dto';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Post()
  create(@Body() dto: CreateNoteDto) {
    return this.noteService.createNote(dto);
  }

  @Get('client/:clientId')
  findAllByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.noteService.getNotesByClient(clientId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.noteService.getNoteById(id);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNoteDto) {
    return this.noteService.updateNote(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.noteService.deleteNote(id);
  }
}
