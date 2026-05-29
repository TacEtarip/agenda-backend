import { Product } from '../models/product.model';

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface IProductRepository {
  create(product: Partial<Product>): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findAllByCompanyId(companyId: string): Promise<Product[]>;
  update(id: string, product: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
}
