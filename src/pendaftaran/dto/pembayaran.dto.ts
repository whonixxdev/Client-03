import { IsEnum } from 'class-validator';
import { MetodePembayaran } from '@prisma/client';

export class CreatePembayaranDto {
  @IsEnum(MetodePembayaran, { message: 'Metode pembayaran harus OFFLINE atau ONLINE.' })
  metode!: MetodePembayaran;
}
