import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsString()
  integrationProvider?: string;

  @IsOptional()
  @IsBoolean()
  syncCalendar?: boolean;

  @IsOptional()
  @IsBoolean()
  syncContacts?: boolean;

  @IsOptional()
  @IsBoolean()
  sendDailyDigest?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentEnabled?: boolean;

  @IsOptional()
  @IsString()
  paymentGatewayKey?: string;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}
