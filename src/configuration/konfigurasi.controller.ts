import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { KonfigurasiService } from './konfigurasi.service';
import { CreateJurusanDto, UpdateJurusanDto } from './dto/jurusan.dto';
import { CreateGelombangDto, UpdateGelombangDto } from './dto/gelombang.dto';
import { PengaturanDto } from './dto/pengaturan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../audit/audit.decorator';

@Controller('konfigurasi')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class KonfigurasiController {
  constructor(private readonly konfigurasiService: KonfigurasiService) {}

  @Get('jurusan')
  @Roles(Role.ADMIN, Role.PANITIA)
  daftarJurusan() {
    return this.konfigurasiService.daftarJurusan(false);
  }

  @Post('jurusan')
  @Audit('JURUSAN_BUAT')
  buatJurusan(@Body() dto: CreateJurusanDto) {
    return this.konfigurasiService.buatJurusan(dto);
  }

  @Patch('jurusan/:id')
  @Audit('JURUSAN_UBAH')
  ubahJurusan(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateJurusanDto) {
    return this.konfigurasiService.ubahJurusan(id, dto);
  }

  @Delete('jurusan/:id')
  @Audit('JURUSAN_HAPUS')
  hapusJurusan(@Param('id', ParseUUIDPipe) id: string) {
    return this.konfigurasiService.hapusJurusan(id);
  }

  @Get('gelombang')
  @Roles(Role.ADMIN, Role.PANITIA)
  daftarGelombang() {
    return this.konfigurasiService.daftarGelombang();
  }

  @Post('gelombang')
  @Audit('GELOMBANG_BUAT')
  buatGelombang(@Body() dto: CreateGelombangDto) {
    return this.konfigurasiService.buatGelombang(dto);
  }

  @Patch('gelombang/:id')
  @Audit('GELOMBANG_UBAH')
  ubahGelombang(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGelombangDto) {
    return this.konfigurasiService.ubahGelombang(id, dto);
  }

  @Delete('gelombang/:id')
  @Audit('GELOMBANG_HAPUS')
  hapusGelombang(@Param('id', ParseUUIDPipe) id: string) {
    return this.konfigurasiService.hapusGelombang(id);
  }

  @Get('pengaturan')
  @Roles(Role.ADMIN, Role.PANITIA)
  daftarPengaturan() {
    return this.konfigurasiService.daftarPengaturan();
  }

  @Put('pengaturan')
  @Audit('PENGATURAN_UBAH')
  ubahPengaturan(@Body() dto: PengaturanDto) {
    return this.konfigurasiService.ubahPengaturan(dto);
  }
}
