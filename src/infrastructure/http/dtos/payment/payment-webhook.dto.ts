import { IsOptional, IsString } from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  @IsOptional()
  internalReferenceId?: string;

  @IsString()
  @IsOptional()
  paymentId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
