import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '@domain/ports/product.repository.interface';
import type { IProductRepository } from '@domain/ports/product.repository.interface';
import { USER_REPOSITORY } from '@domain/ports/user.repository.interface';
import type { IUserRepository } from '@domain/ports/user.repository.interface';
import { Product } from '@domain/models/product.model';

@Injectable()
export class ProductService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  private async assertUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException(`User ${userId} not found`);
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    if (!data.userId) throw new Error('userId is required');
    await this.assertUserExists(data.userId);
    return this.productRepository.create(data);
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException(`Product ${id} not found`);
    return product;
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    await this.assertUserExists(userId);
    return this.productRepository.findAllByUserId(userId);
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
