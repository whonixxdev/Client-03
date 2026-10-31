import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ResendOtpDto {
  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email wajib diisi!' })
  @MaxLength(254)
  email!: string;
}