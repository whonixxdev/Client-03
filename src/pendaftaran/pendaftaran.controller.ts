import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { PendaftaranService } from './pendaftaran.service';
import { CreateBiodataDto } from './dto/biodata.dto';
import { CreatePembayaranDto } from './dto/pembayaran.dto';
import { AVATAR, BUKTI_PEMBAYARAN, UNGGAH_BERKAS_MAKS } from './utils/berkas.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('pendaftaran')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SISWA)
export class PendaftaranController {
  constructor(private readonly pendaftaranService: PendaftaranService) {}

  @Get('me')
  getMyPendaftaran(@GetUser('id') userId: string) {
    return this.pendaftaranService.getMyPendaftaran(userId);
  }

  @Post('biodata')
  @HttpCode(HttpStatus.OK)
  upsertBiodata(@GetUser('id') userId: string, @Body() dto: CreateBiodataDto) {
    return this.pendaftaranService.upsertBiodata(userId, dto);
  }

  @Post('avatar')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: AVATAR.maxBytes, files: 1 } }))
  uploadAvatar(
    @GetUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.pendaftaranService.uploadAvatar(userId, file);
  }

  @Post('berkas/:jenis')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: UNGGAH_BERKAS_MAKS, files: 1 } }))
  uploadBerkas(
    @GetUser('id') userId: string,
    @Param('jenis') jenis: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.pendaftaranService.uploadBerkas(userId, jenis, file);
  }

  @Post('ajukan')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  ajukan(@GetUser('id') userId: string) {
    return this.pendaftaranService.ajukan(userId);
  }

  @Post('pembayaran')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('bukti', { limits: { fileSize: BUKTI_PEMBAYARAN.maxBytes, files: 1 } }))
  submitPembayaran(
    @GetUser('id') userId: string,
    @Body() dto: CreatePembayaranDto,
    @UploadedFile() bukti: Express.Multer.File | undefined,
  ) {
    return this.pendaftaranService.submitPembayaran(userId, dto, bukti);
  }
}
