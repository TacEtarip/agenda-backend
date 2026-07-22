import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterCompanyDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+51\d{9}$/, {
    message: 'El número de celular debe tener el formato +51 seguido de 9 dígitos',
  })
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  companyName!: string;

  @IsOptional()
  @IsBoolean()
  yapeEnabled?: boolean;

  @ValidateIf((dto: RegisterCompanyDto) => dto.yapeEnabled === true)
  @IsString()
  @IsNotEmpty()
  @Matches(/^9\d{8}$/, {
    message: 'El número de Yape debe tener 9 dígitos y empezar con 9',
  })
  yapePhone?: string;

  @ValidateIf((dto: RegisterCompanyDto) => dto.yapeEnabled === true)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/\S/, {
    message: 'El nombre del titular de Yape no puede estar vacío',
  })
  yapeAccountName?: string;
}
