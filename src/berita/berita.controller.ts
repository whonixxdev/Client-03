import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { BeritaService } from './berita.service';
import type { PenggunaBerita } from './berita.service';
import {
  CreateBeritaDto,
  CreateKategoriDto,
  QueryBeritaDto,
  UpdateBeritaDto,
  UpdateKategoriDto,
} from './dto/berita.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Audit } from '../audit/audit.decorator';

const BATAS_GAMBAR = 4 * 1024 * 1024;

@Controller('berita')
export class BeritaPublikController {
  constructor(private readonly beritaService: BeritaService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  daftar(@Query() query: QueryBeritaDto) {
    return this.beritaService.daftarPublik(query);
  }

  @Get('kategori')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  kategori() {
    return this.beritaService.kategoriPublik();
  }

  @Get('detail/:slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300')
  detail(@Param('slug') slug: string) {
    return this.beritaService.detailPublik(slug);
  }
}

@Controller('berita/kelola')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PANITIA)
export class BeritaKelolaController {
  constructor(private readonly beritaService: BeritaService) {}

  @Get()
  daftar(@GetUser() pengguna: PenggunaBerita, @Query() query: QueryBeritaDto) {
    return this.beritaService.daftarKelola(pengguna, query);
  }

  @Post('gambar-konten')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: BATAS_GAMBAR, files: 1 } }))
  uploadGambarKonten(
    @GetUser() pengguna: PenggunaBerita,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.beritaService.uploadGambarKonten(pengguna, file);
  }

  @Post()
  @Audit('BERITA_BUAT')
  buat(@GetUser() pengguna: PenggunaBerita, @Body() dto: CreateBeritaDto) {
    return this.beritaService.buat(pengguna, dto);
  }

  @Get(':id')
  detail(@GetUser() pengguna: PenggunaBerita, @Param('id', ParseUUIDPipe) id: string) {
    return this.beritaService.detailKelola(pengguna, id);
  }

  @Patch(':id')
  @Audit('BERITA_UBAH')
  ubah(
    @GetUser() pengguna: PenggunaBerita,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBeritaDto,
  ) {
    return this.beritaService.ubah(pengguna, id, dto);
  }

  @Post(':id/gambar')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: BATAS_GAMBAR, files: 1 } }))
  uploadGambar(
    @GetUser() pengguna: PenggunaBerita,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.beritaService.uploadGambar(pengguna, id, file);
  }

  @Delete(':id/gambar')
  hapusGambar(@GetUser() pengguna: PenggunaBerita, @Param('id', ParseUUIDPipe) id: string) {
    return this.beritaService.hapusGambar(pengguna, id);
  }

  @Delete(':id')
  @Audit('BERITA_HAPUS')
  hapus(@GetUser() pengguna: PenggunaBerita, @Param('id', ParseUUIDPipe) id: string) {
    return this.beritaService.hapus(pengguna, id);
  }
}

@Controller('kategori-berita')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class KategoriBeritaController {
  constructor(private readonly beritaService: BeritaService) {}

  @Get()
  @Roles(Role.ADMIN, Role.PANITIA)
  daftar() {
    return this.beritaService.daftarKategoriKelola();
  }

  @Post()
  @Audit('KATEGORI_BUAT')
  buat(@Body() dto: CreateKategoriDto) {
    return this.beritaService.buatKategori(dto);
  }

  @Patch(':id')
  @Audit('KATEGORI_UBAH')
  ubah(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateKategoriDto) {
    return this.beritaService.ubahKategori(id, dto);
  }

  @Delete(':id')
  @Audit('KATEGORI_HAPUS')
  hapus(@Param('id', ParseUUIDPipe) id: string) {
    return this.beritaService.hapusKategori(id);
  }
}
