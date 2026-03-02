import { ClientStage } from '@domain/models/client.model';
import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpsertMessageTemplateDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(ClientStage)
  @IsNotEmpty()
  stage!: ClientStage;

  @IsString()
  @IsNotEmpty()
  messageBody!: string;
}
