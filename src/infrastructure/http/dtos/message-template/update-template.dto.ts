import { ClientStage } from '@domain/enums/client-stage.enum';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateMessageTemplateDto {
  @IsEnum(ClientStage)
  @IsOptional()
  stage?: ClientStage;

  @IsString()
  @IsNotEmpty()
  @MaxLength(700)
  @IsOptional()
  messageBody?: string;
}
