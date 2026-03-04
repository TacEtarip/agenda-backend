import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMessageTemplateRepository } from '@domain/ports/message-template.repository.interface';
import { MessageTemplate } from '@domain/models/message-template.model';
import { ClientStage } from '@domain/enums/client-stage.enum';
import { MessageTemplateOrmEntity } from '../entities/message-template.orm-entity';
import { MessageTemplateMapper } from '../mappers/message-template.mapper';

@Injectable()
export class MessageTemplateRepository implements IMessageTemplateRepository {
  constructor(
    @InjectRepository(MessageTemplateOrmEntity)
    private readonly ormRepository: Repository<MessageTemplateOrmEntity>,
  ) {}

  async create(template: MessageTemplate): Promise<MessageTemplate> {
    const ormEntity = MessageTemplateMapper.toOrmEntity(template);
    const savedEntity = await this.ormRepository.save(ormEntity);
    return MessageTemplateMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<MessageTemplate | null> {
    const entity = await this.ormRepository.findOne({ where: { id } });
    if (!entity) return null;
    return MessageTemplateMapper.toDomain(entity);
  }

  async findByUserId(userId: string): Promise<MessageTemplate[]> {
    const entities = await this.ormRepository.find({ where: { userId } });
    return entities.map((entity) => MessageTemplateMapper.toDomain(entity));
  }

  async findByUserAndStage(
    userId: string,
    stage: ClientStage,
  ): Promise<MessageTemplate | null> {
    const entity = await this.ormRepository.findOne({
      where: { userId, stage },
    });
    if (!entity) return null;
    return MessageTemplateMapper.toDomain(entity);
  }

  async update(
    id: string,
    updates: Partial<MessageTemplate>,
  ): Promise<MessageTemplate> {
    const entity = await this.ormRepository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`MessageTemplate with ID ${id} not found`);
    }

    const updatedEntity = Object.assign(entity, updates);
    const savedEntity = await this.ormRepository.save(updatedEntity);
    return MessageTemplateMapper.toDomain(savedEntity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ormRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
