import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UbahProfilDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong.' })
  @MaxLength(100)
  namaLengkap?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+62|62|0)8\d{8,12}$/, { message: 'Format nomor HP tidak valid.' })
  noHp?: string;
}
