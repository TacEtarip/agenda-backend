import { ClientStage } from '@domain/enums/client-stage.enum';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class PreviewMessageTemplateDto {
  @IsEnum(ClientStage)
  stage!: ClientStage;

  @IsString()
  @IsNotEmpty()
  @MaxLength(700)
  messageBody!: string;
}
