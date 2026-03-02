import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ATTACHMENT_REPOSITORY } from '@domain/ports/attachment.repository.interface';
import type { IAttachmentRepository } from '@domain/ports/attachment.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { Attachment } from '@domain/models/attachment.model';

@Injectable()
export class AttachmentService {
  constructor(
    @Inject(ATTACHMENT_REPOSITORY)
    private readonly attachmentRepository: IAttachmentRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
  ) {}

  private async assertClientExists(clientId: string): Promise<void> {
    const client = await this.clientRepository.findById(clientId);
    if (!client) throw new NotFoundException(`Client ${clientId} not found`);
  }

  async createAttachment(data: Partial<Attachment>): Promise<Attachment> {
    if (!data.clientId) throw new Error('clientId is required');
    await this.assertClientExists(data.clientId);
    return this.attachmentRepository.create(data);
  }

  async getAttachmentById(id: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment) throw new NotFoundException(`Attachment ${id} not found`);
    return attachment;
  }

  async getAttachmentsByClient(clientId: string): Promise<Attachment[]> {
    await this.assertClientExists(clientId);
    return this.attachmentRepository.findAllByClientId(clientId);
  }

  async getAttachmentsByNote(noteId: string): Promise<Attachment[]> {
    return this.attachmentRepository.findAllByNoteId(noteId);
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.getAttachmentById(id); // asserts existence
    await this.attachmentRepository.delete(id);
  }
}
