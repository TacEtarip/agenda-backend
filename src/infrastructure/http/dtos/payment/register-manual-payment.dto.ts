import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@domain/enums/payment-method.enum';
import { PaymentSourceDto } from './payment-source.dto';

export class RegisterManualPaymentDto extends PaymentSourceDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: Exclude<PaymentMethod, PaymentMethod.ONLINE>;

  @Type(() => Date)
  @IsDate()
  paidAt!: Date;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
