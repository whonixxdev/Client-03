import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class GantiPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Password lama wajib diisi!' })
  @MaxLength(72)
  passwordLama!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password baru wajib diisi!' })
  @MinLength(8, { message: 'Password minimal harus 8 karakter.' })
  @MaxLength(72, { message: 'Password maksimal 72 karakter.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Password harus mengandung huruf dan angka.' })
  passwordBaru!: string;

  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi!' })
  @MaxLength(72)
  konfirmasiPassword!: string;
}
