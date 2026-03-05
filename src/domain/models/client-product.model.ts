import { ClientProductStatus } from '../enums/client-product-status.enum';

export class ClientProduct {
  id!: string;
  clientId!: string;
  productId!: string;
  status!: ClientProductStatus;
  offeredAt!: Date;
  updatedAt!: Date;
  notes?: string;

  constructor(partial: Partial<ClientProduct>) {
    Object.assign(this, partial);
  }
}
