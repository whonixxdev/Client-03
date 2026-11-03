import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryNotifikasiDto } from './dto/query-notifikasi.dto';

@Injectable()
export class NotifikasiService {
  constructor(private prisma: PrismaService) {}

  async daftar(userId: string, query: QueryNotifikasiDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.KomentarPanitiaWhereInput = { userId };
    if (query.belumDibaca === true) {
      where.dibacaPada = null;
    }

    const [total, belumDibaca, data] = await this.prisma.$transaction([
      this.prisma.komentarPanitia.count({ where }),
      this.prisma.komentarPanitia.count({ where: { userId, dibacaPada: null } }),
      this.prisma.komentarPanitia.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, kategori: true, pesan: true, dibacaPada: true, createdAt: true },
      }),
    ]);

    return {
      status: 'success',
      data,
      belumDibaca,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async jumlahBelumDibaca(userId: string) {
    const belumDibaca = await this.prisma.komentarPanitia.count({
      where: { userId, dibacaPada: null },
    });
    return { status: 'success', data: { belumDibaca } };
  }

  async tandaiBaca(userId: string, id: string) {
    const notifikasi = await this.prisma.komentarPanitia.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!notifikasi) {
      throw new NotFoundException('Notifikasi tidak ditemukan.');
    }

    await this.prisma.komentarPanitia.updateMany({
      where: { id, userId, dibacaPada: null },
      data: { dibacaPada: new Date() },
    });

    return { status: 'success', message: 'Notifikasi ditandai sudah dibaca.' };
  }

  async bacaSemua(userId: string) {
    const hasil = await this.prisma.komentarPanitia.updateMany({
      where: { userId, dibacaPada: null },
      data: { dibacaPada: new Date() },
    });
    return {
      status: 'success',
      message: `${hasil.count} notifikasi ditandai sudah dibaca.`,
      data: { jumlah: hasil.count },
    };
  }
}
