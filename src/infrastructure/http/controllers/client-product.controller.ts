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
import { CurrentUser } from '@infrastructure/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@infrastructure/auth/strategies/jwt.strategy';
import { CreateClientProductDto } from '../dtos/client-product/create-client-product.dto';
import { UpdateClientProductDto } from '../dtos/client-product/update-client-product.dto';
import { ClientProduct } from '@domain/models/client-product.model';

@UseGuards(JwtAuthGuard)
@Controller('client-products')
export class ClientProductController {
  constructor(private readonly clientProductService: ClientProductService) {}

  @Post()
  create(
    @Body() dto: CreateClientProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClientProduct> {
    return this.clientProductService.createClientProduct(
      dto,
      user.companyId || '',
    );
  }

  @Get('client/:clientId')
  findAllByClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClientProduct[]> {
    return this.clientProductService.getClientProductsByClient(
      clientId,
      user.companyId || '',
    );
  }

  @Get('product/:productId')
  findAllByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClientProduct[]> {
    return this.clientProductService.getClientProductsByProduct(
      productId,
      user.companyId || '',
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClientProduct> {
    return this.clientProductService.getClientProductById(
      id,
      user.companyId || '',
    );
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientProductDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ClientProduct> {
    return this.clientProductService.updateClientProduct(
      id,
      dto,
      user.companyId || '',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.clientProductService.deleteClientProduct(
      id,
      user.companyId || '',
    );
  }
}
