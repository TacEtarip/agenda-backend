import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ClientStage } from '@domain/enums/client-stage.enum';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(ClientStage)
  @IsOptional()
  stage?: ClientStage;
}
