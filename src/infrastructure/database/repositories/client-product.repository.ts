import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IClientProductRepository } from '@domain/ports/client-product.repository.interface';
import { ClientProduct } from '@domain/models/client-product.model';
import { ClientProductOrmEntity } from '../entities/client-product.orm-entity';
import { ClientProductMapper } from '../mappers/client-product.mapper';

@Injectable()
export class ClientProductRepository implements IClientProductRepository {
  constructor(
    @InjectRepository(ClientProductOrmEntity)
    private readonly repository: Repository<ClientProductOrmEntity>,
  ) {}

  async create(clientProduct: Partial<ClientProduct>): Promise<ClientProduct> {
    const ormEntity = ClientProductMapper.toOrmEntity(clientProduct);
    const savedEntity = await this.repository.save(ormEntity);
    return ClientProductMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<ClientProduct | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? ClientProductMapper.toDomain(ormEntity) : null;
  }

  async findByClientAndProduct(
    clientId: string,
    productId: string,
  ): Promise<ClientProduct | null> {
    const ormEntity = await this.repository.findOne({
      where: { clientId, productId },
    });
    return ormEntity ? ClientProductMapper.toDomain(ormEntity) : null;
  }

  async findAllByClientId(clientId: string): Promise<ClientProduct[]> {
    const ormEntities = await this.repository.find({
      where: { client: { id: clientId } },
      relations: ['client', 'product'],
    });
    return ormEntities.map((entity: ClientProductOrmEntity) =>
      ClientProductMapper.toDomain(entity),
    );
  }

  async findAllByProductId(productId: string): Promise<ClientProduct[]> {
    const ormEntities = await this.repository.find({
      where: { product: { id: productId } },
      relations: ['client', 'product'],
    });
    return ormEntities.map((entity: ClientProductOrmEntity) =>
      ClientProductMapper.toDomain(entity),
    );
  }

  async update(
    id: string,
    clientProduct: Partial<ClientProduct>,
  ): Promise<ClientProduct> {
    await this.repository.update(
      id,
      ClientProductMapper.toOrmEntity(clientProduct),
    );
    const updatedEntity = await this.repository.findOne({ where: { id } });
    if (!updatedEntity) throw new Error('ClientProduct not found after update');
    return ClientProductMapper.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
