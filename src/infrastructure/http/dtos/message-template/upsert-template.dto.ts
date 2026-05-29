import { ClientStage } from '@domain/enums/client-stage.enum';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpsertMessageTemplateDto {
  @IsEnum(ClientStage)
  @IsNotEmpty()
  stage!: ClientStage;

  @IsString()
  @IsNotEmpty()
  messageBody!: string;
}
