import { ClientProduct } from '../models/client-product.model';

export const CLIENT_PRODUCT_REPOSITORY = 'CLIENT_PRODUCT_REPOSITORY';

export interface IClientProductRepository {
  create(clientProduct: Partial<ClientProduct>): Promise<ClientProduct>;
  findById(id: string): Promise<ClientProduct | null>;
  findByClientAndProduct(
    clientId: string,
    productId: string,
  ): Promise<ClientProduct | null>;
  findAllByClientId(clientId: string): Promise<ClientProduct[]>;
  findAllByProductId(productId: string): Promise<ClientProduct[]>;
  update(
    id: string,
    clientProduct: Partial<ClientProduct>,
  ): Promise<ClientProduct>;
  delete(id: string): Promise<void>;
}
