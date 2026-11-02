import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { KonfirmasiPembayaranDto } from './dto/konfirmasi-pembayaran.dto';
import { QueryPanitiaDto } from './dto/query-panitia.dto';
import { VerifikasiDto } from './dto/verifikasi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('pendaftaran/panitia')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PANITIA, Role.ADMIN)
export class PanitiaController {
  constructor(private readonly panitiaService: PanitiaService) {}

  @Get('all')
  getAll(@Query() query: QueryPanitiaDto) {
    return this.panitiaService.getAll(query);
  }

  @Get('export')
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

  @Get(':userId')
  getDetail(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.panitiaService.getDetail(userId);
  }

  @Patch(':userId/verifikasi')
  @HttpCode(HttpStatus.OK)
  verifikasi(
    @GetUser() aktor: AktorPanitia,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: VerifikasiDto,
  ) {
    return this.panitiaService.verifikasi(aktor, userId, dto);
  }

  @Patch(':userId/pembayaran')
  @HttpCode(HttpStatus.OK)
  konfirmasiPembayaran(
    @GetUser() aktor: AktorPanitia,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: KonfirmasiPembayaranDto,
  ) {
    return this.panitiaService.konfirmasiPembayaran(aktor, userId, dto);
  }

  @Patch(':userId/daftar-ulang')
  @HttpCode(HttpStatus.OK)
  daftarUlang(
    @GetUser() aktor: AktorPanitia,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: DaftarUlangDto,
  ) {
    return this.panitiaService.daftarUlang(aktor, userId, dto);
  }
}
