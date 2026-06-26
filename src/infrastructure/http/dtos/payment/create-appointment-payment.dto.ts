import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateAppointmentPaymentDto {
  @IsUUID()
  appointmentId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @IsOptional()
  description?: string;
}
