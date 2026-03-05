import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ClientProductStatus } from '@domain/enums/client-product-status.enum';

export class CreateClientProductDto {
  @IsUUID()
  clientId!: string;

  @IsUUID()
  productId!: string;

  @IsEnum(ClientProductStatus)
  @IsOptional()
  status?: ClientProductStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
