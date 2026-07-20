import {
  IsBoolean,
  IsDataURI,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateYapeSettingsDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^9\d{8}$/, {
    message: 'Yape phone must contain 9 digits and start with 9',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  accountName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(350_000)
  @IsDataURI()
  @Matches(/^data:image\/(png|jpeg|webp);base64,/i, {
    message: 'Yape QR must be a PNG, JPEG or WebP image',
  })
  qrImageDataUrl?: string | null;
}
