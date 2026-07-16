import {
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CLIENT_PRODUCT_REPOSITORY } from '@domain/ports/client-product.repository.interface';
import type { IClientProductRepository } from '@domain/ports/client-product.repository.interface';
import { CLIENT_REPOSITORY } from '@domain/ports/client.repository.interface';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import { PRODUCT_REPOSITORY } from '@domain/ports/product.repository.interface';
import type { IProductRepository } from '@domain/ports/product.repository.interface';
import { ClientProduct } from '@domain/models/client-product.model';
import { ClientProductStatus } from '@domain/enums/client-product-status.enum';
import { Product } from '@domain/models/product.model';
import { ProductType } from '@domain/enums/product-type.enum';

@Injectable()
export class ClientProductService {
  constructor(
    @Inject(CLIENT_PRODUCT_REPOSITORY)
    private readonly clientProductRepository: IClientProductRepository,
    @Inject(CLIENT_REPOSITORY)
    private readonly clientRepository: IClientRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  private async assertClientExists(
    clientId: string,
    companyId: string,
  ): Promise<void> {
    const client = await this.clientRepository.findById(clientId);
    if (!client?.companyId || client.companyId !== companyId)
      throw new NotFoundException(`Client ${clientId} not found`);
  }

  private async assertProductExists(
    productId: string,
    companyId: string,
  ): Promise<Product> {
    const product = await this.productRepository.findById(productId);
    if (!product?.companyId || product.companyId !== companyId)
      throw new NotFoundException(`Product ${productId} not found`);
    return product;
  }

  async createClientProduct(
    data: Partial<ClientProduct>,
    companyId: string,
  ): Promise<ClientProduct> {
    if (!data.clientId) throw new Error('clientId is required');
    if (!data.productId) throw new Error('productId is required');

    await this.assertClientExists(data.clientId, companyId);
    const product = await this.assertProductExists(data.productId, companyId);
    data.quantity =
      product.type === ProductType.PRODUCT ? (data.quantity ?? 1) : null;

    const existing = (
      await this.clientProductRepository.findAllByClientId(data.clientId)
    ).find(
      (clientProduct) =>
        clientProduct.productId === data.productId &&
        clientProduct.status !== ClientProductStatus.SOLD,
    );
    if (existing) {
      throw new ConflictException(
        'This product is already linked to the client',
      );
    }

    return this.clientProductRepository.create(data);
  }

  async getClientProductById(
    id: string,
    companyId: string,
  ): Promise<ClientProduct> {
    const clientProduct = await this.clientProductRepository.findById(id);
    if (!clientProduct) {
      throw new NotFoundException(`ClientProduct ${id} not found`);
    }
    // Perform soft tenancy check via Client entity
    await this.assertClientExists(clientProduct.clientId, companyId);

    return clientProduct;
  }

  async getClientProductsByClient(
    clientId: string,
    companyId: string,
  ): Promise<ClientProduct[]> {
    await this.assertClientExists(clientId, companyId);
    return this.clientProductRepository.findAllByClientId(clientId);
  }

  async getClientProductsByProduct(
    productId: string,
    companyId: string,
  ): Promise<ClientProduct[]> {
    await this.assertProductExists(productId, companyId);
    return this.clientProductRepository.findAllByProductId(productId);
  }

  async updateClientProduct(
    id: string,
    data: Partial<ClientProduct>,
    companyId: string,
  ): Promise<ClientProduct> {
    await this.getClientProductById(id, companyId); // asserts existence
    if (data.clientId) await this.assertClientExists(data.clientId, companyId);
    if (data.productId)
      await this.assertProductExists(data.productId, companyId);

    if (data.quantity !== undefined) {
      const clientProduct = await this.getClientProductById(id, companyId);
      const product = await this.assertProductExists(
        data.productId ?? clientProduct.productId,
        companyId,
      );
      data.quantity =
        product.type === ProductType.PRODUCT ? data.quantity : null;
    }

    return this.clientProductRepository.update(id, data);
  }

  async deleteClientProduct(id: string, companyId: string): Promise<void> {
    await this.getClientProductById(id, companyId); // asserts existence
    await this.clientProductRepository.delete(id);
  }
}
