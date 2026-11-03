import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CatatanAudit {
  aktorId: string;
  aksi: string;
  targetId?: string | null;
  detail?: string | null;
}

export interface QueryAudit {
  page?: number;
  limit?: number;
  aksi?: string;
  aktorId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async catat(catatan: CatatanAudit): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          aktorId: catatan.aktorId,
          aksi: catatan.aksi,
          targetId: catatan.targetId ?? null,
          detail: catatan.detail ?? null,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Gagal mencatat audit ${catatan.aksi}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async daftar(query: QueryAudit) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;

    const where: Prisma.AuditLogWhereInput = {};
    if (query.aksi) where.aksi = query.aksi;
    if (query.aktorId) where.aktorId = query.aktorId;

    const [total, baris] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const idAktor = [...new Set(baris.map((item) => item.aktorId))];
    const aktor = await this.prisma.user.findMany({
      where: { id: { in: idAktor } },
      select: { id: true, email: true, username: true, namaLengkap: true, role: true },
    });
    const petaAktor = new Map(aktor.map((item) => [item.id, item]));

    const data = baris.map((item) => ({
      ...item,
      aktor: petaAktor.get(item.aktorId) ?? null,
    }));

    return {
      status: 'success',
      data,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }
}
