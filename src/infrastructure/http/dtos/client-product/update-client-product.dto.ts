import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ClientProductStatus } from '@domain/enums/client-product-status.enum';

export class UpdateClientProductDto {
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsUUID()
  @IsOptional()
  productId?: string;

  @IsEnum(ClientProductStatus)
  @IsOptional()
  status?: ClientProductStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
