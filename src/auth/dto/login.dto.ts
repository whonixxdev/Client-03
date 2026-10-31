import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Email atau Username wajib diisi!' })
  @MaxLength(254)
  identifier!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi!' })
  @MaxLength(72)
  password!: string;
}