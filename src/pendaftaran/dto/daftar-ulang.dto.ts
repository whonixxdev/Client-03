import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StatusRegistrasiUlang } from '@prisma/client';

export class DaftarUlangDto {
  @IsEnum(StatusRegistrasiUlang, { message: 'Status registrasi ulang tidak valid.' })
  statusDaftarUlang!: StatusRegistrasiUlang;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  catatanDaftarUlang?: string;
}
