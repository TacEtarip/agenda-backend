import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from '@application/services/product.service';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { CreateProductDto } from '../dtos/product/create-product.dto';
import { UpdateProductDto } from '../dtos/product/update-product.dto';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productService.createProduct(dto);
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.productService.getProductsByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.getProductById(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.deleteProduct(id);
  }
}
