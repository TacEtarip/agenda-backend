export class Product {
  id!: string;
  userId!: string;
  name!: string;
  createdAt!: Date;
  description?: string;
  price?: number;

  constructor(partial: Partial<Product>) {
    Object.assign(this, partial);
  }
}
