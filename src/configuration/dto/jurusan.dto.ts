import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateJurusanDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama jurusan wajib diisi!' })
  @MaxLength(100)
  namaJurusan!: string;

  @IsInt({ message: 'Kuota harus berupa bilangan bulat.' })
  @Min(0)
  @Max(100000)
  kuota!: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Biaya pendaftaran tidak valid.' })
  @Min(0)
  biayaPendaftaran!: number;

  @IsOptional()
  @IsBoolean()
  aktif?: boolean;
}

export class UpdateJurusanDto extends PartialType(CreateJurusanDto) {}
