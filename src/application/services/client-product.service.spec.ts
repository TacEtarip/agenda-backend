import { ConflictException } from '@nestjs/common';
import { Client } from '@domain/models/client.model';
import { ClientProduct } from '@domain/models/client-product.model';
import { Product } from '@domain/models/product.model';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import type { IClientProductRepository } from '@domain/ports/client-product.repository.interface';
import type { IProductRepository } from '@domain/ports/product.repository.interface';
import { ClientProductService } from './client-product.service';

describe('ClientProductService', () => {
  it('rejects a product already linked to the client', async () => {
    const clientProductRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByClientAndProduct: jest.fn().mockResolvedValue(
        new ClientProduct({ id: 'link-1', clientId: 'client-1', productId: 'product-1' }),
      ),
      findAllByClientId: jest.fn(),
      findAllByProductId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IClientProductRepository>;
    const clientRepository = {
      findById: jest.fn().mockResolvedValue(
        new Client({ id: 'client-1', companyId: 'company-1' }),
      ),
    } as unknown as jest.Mocked<IClientRepository>;
    const productRepository = {
      findById: jest.fn().mockResolvedValue(
        new Product({ id: 'product-1', companyId: 'company-1' }),
      ),
    } as unknown as jest.Mocked<IProductRepository>;
    const service = new ClientProductService(
      clientProductRepository,
      clientRepository,
      productRepository,
    );

    await expect(
      service.createClientProduct(
        { clientId: 'client-1', productId: 'product-1' },
        'company-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(clientProductRepository.create).not.toHaveBeenCalled();
  });
});
