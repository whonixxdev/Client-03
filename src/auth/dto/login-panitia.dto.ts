import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class LoginPanitiaDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  panitiaId?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @MaxLength(254)
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi!' })
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Kode OTP harus tepat 6 digit angka.' })
  otpCode?: string;
}