import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateNoteDto {
  @IsUUID()
  clientId!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
