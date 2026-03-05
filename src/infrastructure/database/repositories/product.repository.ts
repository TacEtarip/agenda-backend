import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProductRepository } from '@domain/ports/product.repository.interface';
import { Product } from '@domain/models/product.model';
import { ProductOrmEntity } from '../entities/product.orm-entity';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async create(product: Partial<Product>): Promise<Product> {
    const ormEntity = ProductMapper.toOrmEntity(product);
    const savedEntity = await this.repository.save(ormEntity);
    return ProductMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<Product | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? ProductMapper.toDomain(ormEntity) : null;
  }

  async findAllByUserId(userId: string): Promise<Product[]> {
    const ormEntities = await this.repository.find({ where: { userId } });
    return ormEntities.map((entity) => ProductMapper.toDomain(entity));
  }

  async update(id: string, product: Partial<Product>): Promise<Product> {
    await this.repository.update(id, ProductMapper.toOrmEntity(product));
    const updatedEntity = await this.repository.findOne({ where: { id } });
    if (!updatedEntity) throw new Error('Product not found after update');
    return ProductMapper.toDomain(updatedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
