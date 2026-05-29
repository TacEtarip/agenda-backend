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

  private async assertClientExists(
    clientId: string,
    companyId: string,
  ): Promise<void> {
    const client = await this.clientRepository.findById(clientId);
    if (!client || client.companyId !== companyId)
      throw new NotFoundException(`Client ${clientId} not found`);
  }

  async createAttachment(data: Partial<Attachment>): Promise<Attachment> {
    if (!data.clientId) throw new Error('clientId is required');
    if (!data.companyId) throw new Error('companyId is required');
    await this.assertClientExists(data.clientId, data.companyId);
    return this.attachmentRepository.create(data);
  }

  async getAttachmentById(id: string, companyId: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findById(id, companyId);
    if (!attachment) throw new NotFoundException(`Attachment ${id} not found`);
    return attachment;
  }

  async getAttachmentsByClient(
    clientId: string,
    companyId: string,
  ): Promise<Attachment[]> {
    await this.assertClientExists(clientId, companyId);
    return this.attachmentRepository.findAllByClientId(clientId, companyId);
  }

  async getAttachmentsByNote(
    noteId: string,
    companyId: string,
  ): Promise<Attachment[]> {
    return this.attachmentRepository.findAllByNoteId(noteId, companyId);
  }

  async deleteAttachment(id: string, companyId: string): Promise<void> {
    await this.getAttachmentById(id, companyId); // asserts existence
    await this.attachmentRepository.delete(id);
  }
}
