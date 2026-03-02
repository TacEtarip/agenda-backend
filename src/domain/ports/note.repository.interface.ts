import { Note } from '../models/note.model';

export const NOTE_REPOSITORY = 'NOTE_REPOSITORY';

export interface INoteRepository {
  create(note: Partial<Note>): Promise<Note>;
  findById(id: string): Promise<Note | null>;
  findAllByClientId(clientId: string): Promise<Note[]>;
  update(id: string, note: Partial<Note>): Promise<Note>;
  delete(id: string): Promise<void>;
}
