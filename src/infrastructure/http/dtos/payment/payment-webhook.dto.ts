import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '@domain/enums/payment-status.enum';

export class PaymentWebhookDto {
  @IsString()
  @IsOptional()
  internalReferenceId?: string;

  @IsString()
  paymentId!: string;

  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}
