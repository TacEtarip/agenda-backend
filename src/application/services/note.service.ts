import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NOTE_REPOSITORY } from '@domain/ports/note.repository.interface';
import type { INoteRepository } from '@domain/ports/note.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { Note } from '@domain/models/note.model';

@Injectable()
export class NoteService {
  constructor(
    @Inject(NOTE_REPOSITORY)
    private readonly noteRepository: INoteRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  private async assertClientExists(
    clientId: string,
    companyId: string,
  ): Promise<void> {
    const client = await this.clientRepository.findById(clientId);
    if (!client || client.companyId !== companyId)
      throw new NotFoundException(`Client ${clientId} not found`);
  }

  async createNote(data: Partial<Note>): Promise<Note> {
    if (!data.clientId) throw new Error('clientId is required');
    if (!data.companyId) throw new Error('companyId is required');
    await this.assertClientExists(data.clientId, data.companyId);
    return this.noteRepository.create(data);
  }

  async getNoteById(id: string, companyId: string): Promise<Note> {
    const note = await this.noteRepository.findById(id, companyId);
    if (!note) throw new NotFoundException(`Note ${id} not found`);
    return note;
  }

  async getNotesByClient(clientId: string, companyId: string): Promise<Note[]> {
    await this.assertClientExists(clientId, companyId);
    return this.noteRepository.findAllByClientId(clientId, companyId);
  }

  async updateNote(
    id: string,
    data: Partial<Note>,
    companyId: string,
  ): Promise<Note> {
    await this.getNoteById(id, companyId); // asserts existence
    return this.noteRepository.update(id, data);
  }

  async deleteNote(id: string, companyId: string): Promise<void> {
    await this.getNoteById(id, companyId); // asserts existence
    await this.noteRepository.delete(id);
  }
}
