import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INoteRepository } from '@domain/ports/note.repository.interface';
import { Note } from '@domain/models/note.model';
import { NoteOrmEntity } from '../entities/note.orm-entity';
import { NoteMapper } from '../mappers/note.mapper';

@Injectable()
export class NoteRepository implements INoteRepository {
  constructor(
    @InjectRepository(NoteOrmEntity)
    private readonly repository: Repository<NoteOrmEntity>,
  ) {}

  async create(note: Partial<Note>): Promise<Note> {
    const ormEntity = NoteMapper.toOrmEntity(note);
    const savedEntity = await this.repository.save(ormEntity);
    return NoteMapper.toDomain(savedEntity);
  }

  async findById(id: string, companyId: string): Promise<Note | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, companyId },
    });
    return ormEntity ? NoteMapper.toDomain(ormEntity) : null;
  }

  async findAllByClientId(
    clientId: string,
    companyId: string,
  ): Promise<Note[]> {
    const ormEntities = await this.repository.find({
      where: { client: { id: clientId }, companyId },
      relations: ['client'],
    });
    return ormEntities.map((entity: NoteOrmEntity) =>
      NoteMapper.toDomain(entity),
    );
  }

  async update(id: string, note: Partial<Note>): Promise<Note> {
    await this.repository.update(id, NoteMapper.toOrmEntity(note));
    const updatedEntity = await this.repository.findOne({ where: { id } });
    if (!updatedEntity) throw new Error('Note not found after update');
    return NoteMapper.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
