import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email wajib diisi!' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Kode OTP wajib diisi!' })
  @Matches(/^\d{6}$/, { message: 'Kode OTP harus tepat 6 digit angka.' })
  otpCode!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password baru wajib diisi!' })
  @MinLength(8, { message: 'Password minimal harus 8 karakter.' })
  @MaxLength(72, { message: 'Password maksimal 72 karakter.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Password harus mengandung huruf dan angka.' })
  newPassword!: string;

  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi!' })
  @MaxLength(72)
  confirmPassword!: string;
}