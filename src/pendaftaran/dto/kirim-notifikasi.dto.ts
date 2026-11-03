import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { QueryPanitiaDto } from './query-panitia.dto';

export class KirimNotifikasiDto {
  @IsString()
  @IsNotEmpty({ message: 'Pesan wajib diisi!' })
  @MaxLength(1000)
  pesan!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  userIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => QueryPanitiaDto)
  filter?: QueryPanitiaDto;

  @IsOptional()
  @IsBoolean()
  pratinjau?: boolean;
}
