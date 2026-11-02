import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifikasiDto {
  @IsOptional()
  @IsIn(['REVISI', 'VALID'], { message: 'Status formulir harus REVISI atau VALID.' })
  statusFormulir?: 'REVISI' | 'VALID';

  @IsOptional()
  @IsIn(['REVISI', 'VALID'], { message: 'Status berkas harus REVISI atau VALID.' })
  statusBerkas?: 'REVISI' | 'VALID';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  catatanFormulir?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  catatanAdmin?: string;
}
