import { Product } from '@domain/models/product.model';
import { ProductOrmEntity } from '../entities/product.orm-entity';

export class ProductMapper {
  static toDomain(ormEntity: ProductOrmEntity): Product {
    return new Product({
      id: ormEntity.id,
      userId: ormEntity.userId,
      name: ormEntity.name,
      description: ormEntity.description ?? undefined,
      price:
        ormEntity.price !== null && ormEntity.price !== undefined
          ? Number(ormEntity.price)
          : undefined,
      createdAt: ormEntity.createdAt,
    });
  }

  static toOrmEntity(domainProduct: Partial<Product>): ProductOrmEntity {
    const ormEntity = new ProductOrmEntity();
    if (domainProduct.id) ormEntity.id = domainProduct.id;
    if (domainProduct.userId) ormEntity.userId = domainProduct.userId;
    if (domainProduct.name) ormEntity.name = domainProduct.name;
    if (domainProduct.description !== undefined)
      ormEntity.description = domainProduct.description;
    if (domainProduct.price !== undefined)
      ormEntity.price = domainProduct.price;
    return ormEntity;
  }
}
