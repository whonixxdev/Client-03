import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { PanitiaService } from './panitia.service';
import type { AktorPanitia } from './panitia.service';
import { DaftarUlangDto } from './dto/daftar-ulang.dto';
import { KirimNotifikasiDto } from './dto/kirim-notifikasi.dto';
import { KomentarDto } from './dto/komentar.dto';
import { KonfirmasiPembayaranDto } from './dto/konfirmasi-pembayaran.dto';
import { QueryPanitiaDto } from './dto/query-panitia.dto';
import { VerifikasiDto } from './dto/verifikasi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Audit } from '../audit/audit.decorator';

@Controller('pendaftaran/panitia')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PANITIA, Role.ADMIN)
export class PanitiaController {
  constructor(private readonly panitiaService: PanitiaService) {}

  @Get('all')
  getAll(@Query() query: QueryPanitiaDto) {
    return this.panitiaService.getAll(query);
  }

  @Get('export/status')
  exportStatus(@Query() query: QueryPanitiaDto) {
    return this.panitiaService.exportStatus(query);
  }

  @Get('export')
  @Audit('EKSPOR_EXCEL')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async exportExcel(
    @GetUser() aktor: AktorPanitia,
    @Query() query: QueryPanitiaDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.panitiaService.exportExcel(aktor, query);
    const tanggal = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="data-pendaftar-${tanggal}.xlsx"`,
    });
    return new StreamableFile(buffer);
  }

  @Post('notifikasi')
  @HttpCode(HttpStatus.OK)
  @Audit('NOTIFIKASI_KIRIM')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  kirimNotifikasi(@GetUser() aktor: AktorPanitia, @Body() dto: KirimNotifikasiDto) {
    return this.panitiaService.kirimNotifikasi(aktor, dto);
  }

  @Get(':userId')
  getDetail(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.panitiaService.getDetail(userId);
  }

  @Post(':userId/komentar')
  @HttpCode(HttpStatus.OK)
  @Audit('KOMENTAR_KIRIM')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  kirimKomentar(
    @GetUser() aktor: AktorPanitia,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: KomentarDto,
  ) {
    return this.panitiaService.kirimKomentar(aktor, userId, dto);
  }

  @Patch(':userId/verifikasi')
  @HttpCode(HttpStatus.OK)
  @Audit('VERIFIKASI')
  verifikasi(
    @GetUser() aktor: AktorPanitia,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: VerifikasiDto,
  ) {
    return this.panitiaService.verifikasi(aktor, userId, dto);
  }

  @Patch(':userId/pembayaran')
  @HttpCode(HttpStatus.OK)
  @Audit('PEMBAYARAN_KONFIRMASI')
  konfirmasiPembayaran(
    @GetUser() aktor: AktorPanitia,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: KonfirmasiPembayaranDto,
  ) {
    return this.panitiaService.konfirmasiPembayaran(aktor, userId, dto);
  }

  @Patch(':userId/daftar-ulang')
  @HttpCode(HttpStatus.OK)
  @Audit('DAFTAR_ULANG')
  daftarUlang(
    @GetUser() aktor: AktorPanitia,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: DaftarUlangDto,
  ) {
    return this.panitiaService.daftarUlang(aktor, userId, dto);
  }
}
