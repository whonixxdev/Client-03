import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class KonfirmasiPembayaranDto {
  @IsIn(['LUNAS', 'REVISI'], { message: 'Status pembayaran harus LUNAS atau REVISI.' })
  status!: 'LUNAS' | 'REVISI';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  catatan?: string;
}
