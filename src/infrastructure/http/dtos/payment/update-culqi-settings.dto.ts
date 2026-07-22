import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateCulqiSettingsDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^pk_(test|live)_.+$/, {
    message: 'Culqi public key must be a test or live public key',
  })
  publicKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^sk_(test|live)_.+$/, {
    message: 'Culqi private key must be a test or live private key',
  })
  privateKey?: string;

  @IsOptional()
  @IsBoolean()
  clearPrivateKey?: boolean;
}
