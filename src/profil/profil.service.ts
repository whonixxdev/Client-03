import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PendaftaranService } from '../pendaftaran/pendaftaran.service';
import { AVATAR } from '../pendaftaran/utils/berkas.config';
import { olahAvatar } from '../pendaftaran/utils/avatar.util';
import { validateFile } from '../pendaftaran/utils/file.util';
import { UbahProfilDto } from './dto/ubah-profil.dto';
import { GantiPasswordDto } from './dto/ganti-password.dto';

export interface PenggunaProfil {
  id: string;
  role: Role;
}

const MASA_URL_AVATAR = 3600;

@Injectable()
export class ProfilService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private pendaftaran: PendaftaranService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        panitiaId: true,
        role: true,
        namaLengkap: true,
        noHp: true,
        avatarUrl: true,
        createdAt: true,
        biodata: { select: { namaLengkap: true, noHpSiswa: true, avatarUrl: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const key = user.role === Role.SISWA ? user.biodata?.avatarUrl : user.avatarUrl;
    const avatarUrl = key
      ? await this.storage.createSignedUrl(key, MASA_URL_AVATAR, 'avatar')
      : null;

    return {
      status: 'success',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        panitiaId: user.panitiaId,
        role: user.role,
        namaLengkap: user.biodata?.namaLengkap ?? user.namaLengkap ?? user.username,
        noHp: user.biodata?.noHpSiswa ?? user.noHp,
        avatarUrl,
        adaAvatar: Boolean(key),
        createdAt: user.createdAt,
      },
    };
  }

  async ubahProfil(pengguna: PenggunaProfil, dto: UbahProfilDto) {
    if (pengguna.role === Role.SISWA) {
      throw new ForbiddenException('Data siswa diubah melalui formulir biodata pendaftaran.');
    }

    if (dto.namaLengkap === undefined && dto.noHp === undefined) {
      throw new BadRequestException('Tidak ada data yang diubah.');
    }

    await this.prisma.user.update({
      where: { id: pengguna.id },
      data: { namaLengkap: dto.namaLengkap?.trim(), noHp: dto.noHp },
    });

    return this.getMe(pengguna.id);
  }

  async uploadAvatar(pengguna: PenggunaProfil, file: Express.Multer.File | undefined) {
    if (pengguna.role === Role.SISWA) {
      return this.pendaftaran.uploadAvatar(pengguna.id, file);
    }

    const valid = validateFile(file, AVATAR.maxBytes, AVATAR.tipe);
    const hasil = await olahAvatar(valid.buffer);
    const key = `avatar/${pengguna.id}.jpg`;

    await this.storage.upload(key, hasil, 'image/jpeg', 'avatar');
    await this.prisma.user.update({ where: { id: pengguna.id }, data: { avatarUrl: key } });

    return {
      status: 'success',
      message: 'Foto profil berhasil diunggah.',
      data: { url: await this.storage.createSignedUrl(key, MASA_URL_AVATAR, 'avatar') },
    };
  }

  async gantiPassword(userId: string, dto: GantiPasswordDto) {
    if (dto.passwordBaru !== dto.konfirmasiPassword) {
      throw new BadRequestException('Konfirmasi password tidak cocok!');
    }

    if (dto.passwordBaru === dto.passwordLama) {
      throw new BadRequestException('Password baru harus berbeda dari password lama.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const cocok = await bcrypt.compare(dto.passwordLama, user.password);
    if (!cocok) {
      throw new UnauthorizedException('Password lama salah.');
    }

    const hash = await bcrypt.hash(dto.passwordBaru, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hash, passwordChangedAt: new Date() },
    });

    return {
      status: 'success',
      message: 'Password berhasil diubah. Silakan login kembali dengan password baru.',
    };
  }
}
