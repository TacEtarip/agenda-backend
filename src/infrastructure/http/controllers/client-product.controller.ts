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
import { ClientProductService } from '@application/services/client-product.service';
import { JwtAuthGuard } from '@infrastructure/auth/guards/jwt-auth.guard';
import { CreateClientProductDto } from '../dtos/client-product/create-client-product.dto';
import { UpdateClientProductDto } from '../dtos/client-product/update-client-product.dto';

@UseGuards(JwtAuthGuard)
@Controller('client-products')
export class ClientProductController {
  constructor(private readonly clientProductService: ClientProductService) {}

  @Post()
  create(@Body() dto: CreateClientProductDto) {
    return this.clientProductService.createClientProduct(dto);
  }

  @Get('client/:clientId')
  findAllByClient(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.clientProductService.getClientProductsByClient(clientId);
  }

  @Get('product/:productId')
  findAllByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.clientProductService.getClientProductsByProduct(productId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientProductService.getClientProductById(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientProductDto,
  ) {
    return this.clientProductService.updateClientProduct(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientProductService.deleteClientProduct(id);
  }
}
