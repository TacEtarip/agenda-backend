import { Module } from '@nestjs/common';
import { ProductService } from '@application/services/product.service';
import { ProductController } from '../http/controllers/product.controller';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
