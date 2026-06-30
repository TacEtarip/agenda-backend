import {
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ProductType } from '@domain/enums/product-type.enum';

export class CreateProductDto {
  @IsEnum(ProductType)
  @IsOptional()
  type: ProductType = ProductType.PRODUCT;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;
}
