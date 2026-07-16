import { ConflictException } from '@nestjs/common';
import { Client } from '@domain/models/client.model';
import { ClientProduct } from '@domain/models/client-product.model';
import { Product } from '@domain/models/product.model';
import type { IClientRepository } from '@domain/ports/client.repository.interface';
import type { IClientProductRepository } from '@domain/ports/client-product.repository.interface';
import type { IProductRepository } from '@domain/ports/product.repository.interface';
import { ClientProductStatus } from '@domain/enums/client-product-status.enum';
import { ProductType } from '@domain/enums/product-type.enum';
import { ClientProductService } from './client-product.service';

describe('ClientProductService', () => {
  it('rejects a product already linked to the client', async () => {
    const clientProductRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByClientAndProduct: jest.fn(),
      findAllByClientId: jest.fn().mockResolvedValue([
        new ClientProduct({
          id: 'link-1',
          clientId: 'client-1',
          productId: 'product-1',
          status: ClientProductStatus.OFFERED,
        }),
      ]),
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
        new Product({ id: 'product-1', companyId: 'company-1', type: ProductType.PRODUCT }),
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

  it('allows offering the same product again after a sold link', async () => {
    const created = new ClientProduct({
      id: 'link-2',
      clientId: 'client-1',
      productId: 'product-1',
      status: ClientProductStatus.OFFERED,
    });
    const clientProductRepository = {
      create: jest.fn().mockResolvedValue(created),
      findById: jest.fn(),
      findByClientAndProduct: jest.fn(),
      findAllByClientId: jest.fn().mockResolvedValue([
        new ClientProduct({
          id: 'link-1',
          clientId: 'client-1',
          productId: 'product-1',
          status: ClientProductStatus.SOLD,
        }),
      ]),
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
        new Product({ id: 'product-1', companyId: 'company-1', type: ProductType.PRODUCT }),
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
    ).resolves.toBe(created);
    expect(clientProductRepository.create).toHaveBeenCalledWith({
      clientId: 'client-1',
      productId: 'product-1',
      quantity: 1,
    });
  });
});
