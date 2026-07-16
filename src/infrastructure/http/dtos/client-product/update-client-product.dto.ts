import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
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

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  customPrice?: number | null;

  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number | null;
}
