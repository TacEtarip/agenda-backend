import { ClientProduct } from '@domain/models/client-product.model';
import { ClientProductOrmEntity } from '../entities/client-product.orm-entity';

export class ClientProductMapper {
  static toDomain(ormEntity: ClientProductOrmEntity): ClientProduct {
    return new ClientProduct({
      id: ormEntity.id,
      clientId: ormEntity.clientId,
      productId: ormEntity.productId,
      status: ormEntity.status,
      notes: ormEntity.notes ?? undefined,
      offeredAt: ormEntity.offeredAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toOrmEntity(
    domainClientProduct: Partial<ClientProduct>,
  ): ClientProductOrmEntity {
    const ormEntity = new ClientProductOrmEntity();
    if (domainClientProduct.id) ormEntity.id = domainClientProduct.id;
    if (domainClientProduct.clientId)
      ormEntity.clientId = domainClientProduct.clientId;
    if (domainClientProduct.productId)
      ormEntity.productId = domainClientProduct.productId;
    if (domainClientProduct.status)
      ormEntity.status = domainClientProduct.status;
    if (domainClientProduct.notes !== undefined)
      ormEntity.notes = domainClientProduct.notes;
    if (domainClientProduct.offeredAt)
      ormEntity.offeredAt = domainClientProduct.offeredAt;
    return ormEntity;
  }
}
