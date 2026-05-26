import { IsEmail, IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'juan@empresa.com' })
  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'MiEmpresaMLM' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  companyName: string;

  @ApiProperty({ example: 'mi-empresa-mlm', description: 'URL amigable única' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minúsculas, números y guiones' })
  @MinLength(3)
  @MaxLength(50)
  @Transform(({ value }) => value.toLowerCase().trim())
  slug: string;

  @ApiProperty({ example: 'Password123!', description: 'Mínimo 8 caracteres, mayúscula, número' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe tener al menos una mayúscula, una minúscula y un número',
  })
  password: string;
}
