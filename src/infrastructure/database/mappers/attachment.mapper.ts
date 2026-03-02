import { Attachment } from '@domain/models/attachment.model';
import { AttachmentOrmEntity } from '../entities/attachment.orm-entity';

export class AttachmentMapper {
  static toDomain(ormEntity: AttachmentOrmEntity): Attachment {
    return new Attachment({
      id: ormEntity.id,
      clientId: ormEntity.clientId,
      fileName: ormEntity.fileName,
      fileUrl: ormEntity.fileUrl,
      uploadedAt: ormEntity.uploadedAt,
      fileType: ormEntity.fileType,
      noteId: ormEntity.noteId,
    });
  }

  static toOrmEntity(
    domainAttachment: Partial<Attachment>,
  ): AttachmentOrmEntity {
    const ormEntity = new AttachmentOrmEntity();
    if (domainAttachment.id) ormEntity.id = domainAttachment.id;
    if (domainAttachment.clientId)
      ormEntity.clientId = domainAttachment.clientId;
    if (domainAttachment.fileName)
      ormEntity.fileName = domainAttachment.fileName;
    if (domainAttachment.fileUrl) ormEntity.fileUrl = domainAttachment.fileUrl;
    if (domainAttachment.fileType !== undefined)
      ormEntity.fileType = domainAttachment.fileType;
    if (domainAttachment.noteId !== undefined)
      ormEntity.noteId = domainAttachment.noteId;
    return ormEntity;
  }
}
