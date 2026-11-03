import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class KomentarDto {
  @IsString()
  @IsNotEmpty({ message: 'Pesan wajib diisi!' })
  @MaxLength(1000)
  pesan!: string;
}
