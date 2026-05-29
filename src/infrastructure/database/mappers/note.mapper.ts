import { Note } from '@domain/models/note.model';
import { NoteOrmEntity } from '../entities/note.orm-entity';

export class NoteMapper {
  static toDomain(ormEntity: NoteOrmEntity): Note {
    return new Note({
      id: ormEntity.id,
      companyId: ormEntity.companyId,
      clientId: ormEntity.clientId,
      content: ormEntity.content,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toOrmEntity(domainNote: Partial<Note>): NoteOrmEntity {
    const ormEntity = new NoteOrmEntity();
    if (domainNote.id) ormEntity.id = domainNote.id;
    if (domainNote.companyId !== undefined)
      ormEntity.companyId = domainNote.companyId!;
    if (domainNote.clientId) ormEntity.clientId = domainNote.clientId;
    if (domainNote.content) ormEntity.content = domainNote.content;
    return ormEntity;
  }
}
