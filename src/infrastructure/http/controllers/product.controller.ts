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
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';
import { CreateProductDto } from '../dtos/product/create-product.dto';
import { UpdateProductDto } from '../dtos/product/update-product.dto';

@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() dto: CreateProductDto, @CurrentUser() user: AuthenticatedUser) {
    return this.productService.createProduct({
      ...dto,
      companyId: user.companyId,
      userId: user.userId,
    });
  }

  @Get()
  findAllByCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.productService.getProductsByCompany(user.companyId || '');
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productService.getProductById(id, user.companyId || '');
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productService.updateProduct(id, dto, user.companyId || '');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.productService.deleteProduct(id, user.companyId || '');
  }
}
