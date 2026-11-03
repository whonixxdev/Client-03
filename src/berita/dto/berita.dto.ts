import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBeritaDto {
  @IsString()
  @IsNotEmpty({ message: 'Judul wajib diisi!' })
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Isi berita wajib diisi!' })
  @MaxLength(100000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  excerpt?: string;

  @IsUUID('all', { message: 'Kategori tidak valid.' })
  categoryId!: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateBeritaDto extends PartialType(CreateBeritaDto) {}

export class QueryBeritaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  kategori?: string;

  @IsOptional()
  @IsIn(['terbit', 'draft'])
  status?: 'terbit' | 'draft';
}

export class CreateKategoriDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama kategori wajib diisi!' })
  @MaxLength(60)
  name!: string;
}

export class UpdateKategoriDto extends PartialType(CreateKategoriDto) {}
