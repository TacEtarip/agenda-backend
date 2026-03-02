import { Module } from '@nestjs/common';
import { NoteService } from '@application/services/note.service';
import { NoteController } from '../http/controllers/note.controller';

@Module({
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService],
})
export class NoteModule {}
