import { Attachment } from '../models/attachment.model';

export const ATTACHMENT_REPOSITORY = 'ATTACHMENT_REPOSITORY';

export interface IAttachmentRepository {
  create(attachment: Partial<Attachment>): Promise<Attachment>;
  findById(id: string, companyId: string): Promise<Attachment | null>;
  findAllByClientId(clientId: string, companyId: string): Promise<Attachment[]>;
  findAllByNoteId(noteId: string, companyId: string): Promise<Attachment[]>;
  delete(id: string): Promise<void>;
}
