import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ProfilService } from './profil.service';
import type { PenggunaProfil } from './profil.service';
import { UbahProfilDto } from './dto/ubah-profil.dto';
import { GantiPasswordDto } from './dto/ganti-password.dto';
import { AVATAR } from '../pendaftaran/utils/berkas.config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('profil')
@UseGuards(JwtAuthGuard)
export class ProfilController {
  constructor(private readonly profilService: ProfilService) {}

  @Get('me')
  getMe(@GetUser('id') userId: string) {
    return this.profilService.getMe(userId);
  }

  @Patch('me')
  ubahProfil(@GetUser() pengguna: PenggunaProfil, @Body() dto: UbahProfilDto) {
    return this.profilService.ubahProfil(pengguna, dto);
  }

  @Post('avatar')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: AVATAR.maxBytes, files: 1 } }))
  uploadAvatar(
    @GetUser() pengguna: PenggunaProfil,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.profilService.uploadAvatar(pengguna, file);
  }

  @Post('ganti-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  gantiPassword(@GetUser('id') userId: string, @Body() dto: GantiPasswordDto) {
    return this.profilService.gantiPassword(userId, dto);
  }
}
