import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGelombangDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama gelombang wajib diisi!' })
  @MaxLength(50)
  nama!: string;

  @IsDateString({}, { message: 'Format tanggal mulai tidak valid.' })
  tanggalMulai!: string;

  @IsDateString({}, { message: 'Format tanggal selesai tidak valid.' })
  tanggalSelesai!: string;

  @IsOptional()
  @IsBoolean()
  aktif?: boolean;
}

export class UpdateGelombangDto extends PartialType(CreateGelombangDto) {}
