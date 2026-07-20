import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmYapePaymentDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;
}
