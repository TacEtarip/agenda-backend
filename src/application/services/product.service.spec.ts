import { NotFoundException } from '@nestjs/common';
import { Product } from '@domain/models/product.model';
import { IProductRepository } from '@domain/ports/product.repository.interface';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let repository: jest.Mocked<IProductRepository>;
  let service: ProductService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAllByCompanyId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new ProductService(repository);
  });

  it('returns a product when it belongs to the requested company', async () => {
    const product = new Product({
      id: 'product-id',
      companyId: 'company-a',
      name: 'Consulta',
    });
    repository.findById.mockResolvedValue(product);

    await expect(
      service.getProductById('product-id', 'company-a'),
    ).resolves.toBe(product);
  });

  it('hides products from other companies', async () => {
    repository.findById.mockResolvedValue(
      new Product({
        id: 'product-id',
        companyId: 'company-b',
        name: 'Consulta',
      }),
    );

    await expect(
      service.getProductById('product-id', 'company-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
