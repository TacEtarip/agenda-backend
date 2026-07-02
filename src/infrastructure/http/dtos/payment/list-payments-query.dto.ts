import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PaymentSourceType } from '@domain/enums/payment-source-type.enum';
import { PaymentStatus } from '@domain/enums/payment-status.enum';

export class ListPaymentsQueryDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsEnum(PaymentSourceType)
  sourceType?: PaymentSourceType;

  @IsOptional()
  @IsUUID()
  sourceId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;
}
