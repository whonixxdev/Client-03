import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { StatusRegistrasiUlang, StatusVerifikasi } from '@prisma/client';

export class QueryPanitiaDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsUUID('all')
  jurusanId?: string;

  @IsOptional()
  @IsUUID('all')
  gelombangId?: string;

  @IsOptional()
  @IsEnum(StatusVerifikasi)
  statusFormulir?: StatusVerifikasi;

  @IsOptional()
  @IsEnum(StatusVerifikasi)
  statusBerkas?: StatusVerifikasi;

  @IsOptional()
  @IsEnum(StatusVerifikasi)
  statusPembayaran?: StatusVerifikasi;

  @IsOptional()
  @IsEnum(StatusRegistrasiUlang)
  statusDaftarUlang?: StatusRegistrasiUlang;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  diajukan?: boolean;
}
