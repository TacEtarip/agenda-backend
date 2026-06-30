import { ProductType } from '../enums/product-type.enum';

export class Product {
  id!: string;
  companyId?: string;
  userId!: string;
  name!: string;
  createdAt!: Date;
  description?: string;
  price?: number;
  type!: ProductType;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}
