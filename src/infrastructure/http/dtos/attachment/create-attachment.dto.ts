import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAttachmentDto {
  @IsUUID()
  clientId!: string;

  @IsUUID()
  @IsOptional()
  noteId?: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsOptional()
  fileType?: string;

  @IsString()
  @IsNotEmpty()
  fileUrl!: string;
}
