import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterPanitiaDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi!' })
  @MaxLength(100)
  namaLengkap!: string;

  @IsString()
  @IsNotEmpty({ message: 'Username wajib diisi!' })
  @Matches(/^[A-Za-z0-9_.]{3,30}$/, {
    message: 'Username 3-30 karakter, hanya huruf, angka, titik, dan garis bawah.',
  })
  username!: string;

  @IsEmail({}, { message: 'Format email tidak valid.' })
  @IsNotEmpty({ message: 'Email wajib diisi!' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Nomor HP wajib diisi!' })
  @Matches(/^(\+62|62|0)8\d{8,12}$/, { message: 'Format nomor HP tidak valid.' })
  noHp!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi!' })
  @MinLength(8, { message: 'Password minimal harus 8 karakter.' })
  @MaxLength(72, { message: 'Password maksimal 72 karakter.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Password harus mengandung huruf dan angka.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi!' })
  @MaxLength(72)
  confirmPassword!: string;
}