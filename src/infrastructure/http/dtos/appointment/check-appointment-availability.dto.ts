import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CheckAppointmentAvailabilityDto {
  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;

  @IsUUID()
  @IsOptional()
  excludeAppointmentId?: string;
}
