import { ClientStage } from '@domain/enums/client-stage.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMessageTemplateDto {
  @IsEnum(ClientStage)
  @IsOptional()
  stage?: ClientStage;

  @IsString()
  @IsOptional()
  messageBody?: string;
}
