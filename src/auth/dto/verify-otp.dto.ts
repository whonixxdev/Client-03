import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email wajib diisi!' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Kode OTP wajib diisi!' })
  @Matches(/^\d{6}$/, { message: 'Kode OTP harus tepat 6 digit angka.' })
  otpCode!: string;
}