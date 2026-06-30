import { IsEnum, IsUUID } from 'class-validator';
import { PaymentSourceType } from '@domain/enums/payment-source-type.enum';

export class PaymentSourceDto {
  @IsEnum(PaymentSourceType)
  sourceType!: PaymentSourceType;

  @IsUUID()
  sourceId!: string;
}
