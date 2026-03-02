import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAttachmentRepository } from '@domain/ports/attachment.repository.interface';
import { Attachment } from '@domain/models/attachment.model';
import { AttachmentOrmEntity } from '../entities/attachment.orm-entity';
import { AttachmentMapper } from '../mappers/attachment.mapper';

@Injectable()
export class AttachmentRepository implements IAttachmentRepository {
  constructor(
    @InjectRepository(AttachmentOrmEntity)
    private readonly repository: Repository<AttachmentOrmEntity>,
  ) {}

  async create(attachment: Partial<Attachment>): Promise<Attachment> {
    const ormEntity = AttachmentMapper.toOrmEntity(attachment);
    const savedEntity = await this.repository.save(ormEntity);
    return AttachmentMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Attachment | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? AttachmentMapper.toDomain(ormEntity) : null;
  }

  async findAllByClientId(clientId: string): Promise<Attachment[]> {
    const ormEntities = await this.repository.find({ where: { clientId } });
    return ormEntities.map((entity) => AttachmentMapper.toDomain(entity));
  }

  async findAllByNoteId(noteId: string): Promise<Attachment[]> {
    const ormEntities = await this.repository.find({ where: { noteId } });
    return ormEntities.map((entity) => AttachmentMapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
