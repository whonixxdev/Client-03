import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PengaturanDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankNama?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bankNomorRekening?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bankAtasNama?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instruksiPembayaranOffline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instruksiRegistrasiUlang?: string;
}
