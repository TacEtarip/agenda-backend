import { ClientProductStatus } from '../enums/client-product-status.enum';

export class ClientProduct {
  id!: string;
  clientId!: string;
  productId!: string;
  status!: ClientProductStatus;
  offeredAt!: Date;
  updatedAt!: Date;
  customPrice?: number | null;
  quantity?: number | null;
  notes?: string;

  constructor(partial: Partial<ClientProduct>) {
    Object.assign(this, partial);
  }
}
