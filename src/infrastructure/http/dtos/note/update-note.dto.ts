import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content?: string;
}
