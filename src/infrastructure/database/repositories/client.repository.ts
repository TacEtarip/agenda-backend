import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IClientRepository } from '@domain/ports/client.repository.interface';
import { Client } from '@domain/models/client.model';
import { ClientOrmEntity } from '../entities/client.orm-entity';
import { ClientMapper } from '../mappers/client.mapper';

@Injectable()
export class ClientRepository implements IClientRepository {
  constructor(
    @InjectRepository(ClientOrmEntity)
    private readonly repository: Repository<ClientOrmEntity>,
  ) {}

  async create(client: Partial<Client>): Promise<Client> {
    const ormEntity = ClientMapper.toOrmEntity(client);
    const savedEntity = await this.repository.save(ormEntity);
    return ClientMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Client | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? ClientMapper.toDomain(ormEntity) : null;
  }

  async findAllByUserId(userId: string): Promise<Client[]> {
    const ormEntities = await this.repository.find({ where: { userId } });
    return ormEntities.map((entity) => ClientMapper.toDomain(entity));
  }

  async update(id: string, client: Partial<Client>): Promise<Client> {
    await this.repository.update(id, ClientMapper.toOrmEntity(client));
    const updatedEntity = await this.repository.findOne({ where: { id } });
    if (!updatedEntity) throw new Error('Client not found after update');
    return ClientMapper.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
