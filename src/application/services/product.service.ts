import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '@domain/ports/product.repository.interface';
import type { IProductRepository } from '@domain/ports/product.repository.interface';
import { Product } from '@domain/models/product.model';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async createProduct(data: Partial<Product>): Promise<Product> {
    if (!data.companyId) throw new Error('companyId is required');
    return this.productRepository.create(data);
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  getProductsByCompany(companyId: string): Promise<Product[]> {
    return this.productRepository.findAllByCompanyId(companyId);
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    await this.getProductById(id); // asserts existence
    return this.productRepository.update(id, data);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id); // asserts existence
    await this.productRepository.delete(id);
  }
}
