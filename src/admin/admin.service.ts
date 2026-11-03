import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, StatusVerifikasi } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAkunPanitiaDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async statistik() {
    const diajukan: Prisma.BiodataSiswaWhereInput = { diajukanPada: { not: null } };
    const sejak = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalAkun,
      akunTerverifikasi,
      totalDiajukan,
      formulir,
      berkas,
      pembayaran,
      metode,
      daftarUlang,
      jurusan,
      pilihanUtama,
      pilihanCadangan,
      diterima,
      gelombang,
      perGelombang,
      harian,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.SISWA } }),
      this.prisma.user.count({ where: { role: Role.SISWA, isVerified: true } }),
      this.prisma.biodataSiswa.count({ where: diajukan }),
      this.prisma.biodataSiswa.groupBy({
        by: ['statusFormulir'],
        where: diajukan,
        _count: { _all: true },
      }),
      this.prisma.berkasSiswa.groupBy({
        by: ['statusVerifikasi'],
        where: { user: { biodata: { is: diajukan } } },
        _count: { _all: true },
      }),
      this.prisma.pembayaran.groupBy({
        by: ['status'],
        _count: { _all: true },
        _sum: { jumlah: true },
      }),
      this.prisma.pembayaran.groupBy({ by: ['metode'], _count: { _all: true } }),
      this.prisma.biodataSiswa.groupBy({
        by: ['statusDaftarUlang'],
        where: { user: { pembayaran: { is: { status: StatusVerifikasi.LUNAS } } } },
        _count: { _all: true },
      }),
      this.prisma.jurusan.findMany({
        orderBy: { namaJurusan: 'asc' },
        select: { id: true, namaJurusan: true, kuota: true, aktif: true },
      }),
      this.prisma.biodataSiswa.groupBy({
        by: ['jurusanId'],
        where: diajukan,
        _count: { _all: true },
      }),
      this.prisma.biodataSiswa.groupBy({
        by: ['jurusanCadanganId'],
        where: diajukan,
        _count: { _all: true },
      }),
      this.prisma.biodataSiswa.groupBy({
        by: ['jurusanDiterimaId'],
        where: { jurusanDiterimaId: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.gelombangPendaftaran.findMany({
        orderBy: { tanggalMulai: 'asc' },
        select: { id: true, nama: true, tanggalMulai: true, tanggalSelesai: true, aktif: true },
      }),
      this.prisma.biodataSiswa.groupBy({
        by: ['gelombangId'],
        where: { gelombangId: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<Array<{ hari: string; jumlah: number }>>`
        SELECT to_char((("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Makassar'), 'YYYY-MM-DD') AS hari,
               COUNT(*)::int AS jumlah
        FROM users
        WHERE role = 'SISWA' AND "createdAt" >= ${sejak}
        GROUP BY 1
        ORDER BY 1`,
    ]);

    const petaUtama = new Map(pilihanUtama.map((item) => [item.jurusanId, item._count._all]));
    const petaCadangan = new Map(
      pilihanCadangan.map((item) => [item.jurusanCadanganId, item._count._all]),
    );
    const petaDiterima = new Map(diterima.map((item) => [item.jurusanDiterimaId, item._count._all]));
    const petaGelombang = new Map(perGelombang.map((item) => [item.gelombangId, item._count._all]));

    const jumlahLunas = pembayaran.find((item) => item.status === StatusVerifikasi.LUNAS);

    return {
      status: 'success',
      data: {
        akun: { totalSiswa: totalAkun, terverifikasi: akunTerverifikasi },
        pendaftaran: {
          diajukan: totalDiajukan,
          formulir: Object.fromEntries(formulir.map((item) => [item.statusFormulir, item._count._all])),
          berkas: Object.fromEntries(berkas.map((item) => [item.statusVerifikasi, item._count._all])),
        },
        pembayaran: {
          perStatus: Object.fromEntries(pembayaran.map((item) => [item.status, item._count._all])),
          perMetode: Object.fromEntries(metode.map((item) => [item.metode, item._count._all])),
          totalLunas: jumlahLunas?._sum.jumlah ?? 0,
        },
        registrasiUlang: Object.fromEntries(
          daftarUlang.map((item) => [item.statusDaftarUlang, item._count._all]),
        ),
        perJurusan: jurusan.map((item) => {
          const jumlahDiterima = petaDiterima.get(item.id) ?? 0;
          return {
            id: item.id,
            namaJurusan: item.namaJurusan,
            aktif: item.aktif,
            kuota: item.kuota,
            pilihanUtama: petaUtama.get(item.id) ?? 0,
            pilihanCadangan: petaCadangan.get(item.id) ?? 0,
            diterima: jumlahDiterima,
            sisaKuota: Math.max(0, item.kuota - jumlahDiterima),
          };
        }),
        perGelombang: gelombang.map((item) => ({
          ...item,
          jumlahSiswa: petaGelombang.get(item.id) ?? 0,
        })),
        akunBaruHarian: harian,
      },
    };
  }

  async daftarPanitia(query: QueryAkunPanitiaDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.UserWhereInput = { role: Role.PANITIA };
    if (query.search) {
      const kata = query.search.trim();
      where.OR = [
        { namaLengkap: { contains: kata, mode: 'insensitive' } },
        { username: { contains: kata, mode: 'insensitive' } },
        { email: { contains: kata.toLowerCase() } },
        { panitiaId: { contains: kata.toUpperCase() } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          panitiaId: true,
          email: true,
          username: true,
          namaLengkap: true,
          noHp: true,
          isVerified: true,
          aktif: true,
          terkunciSampai: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      status: 'success',
      data,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  private async ambilPanitia(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: Role.PANITIA },
      select: { id: true, aktif: true },
    });
    if (!user) {
      throw new NotFoundException('Akun panitia tidak ditemukan.');
    }
    return user;
  }

  async ubahStatusPanitia(id: string, aktif: boolean) {
    await this.ambilPanitia(id);

    await this.prisma.user.update({
      where: { id },
      data: { aktif },
    });

    return {
      status: 'success',
      message: aktif ? 'Akun panitia diaktifkan.' : 'Akun panitia dinonaktifkan.',
    };
  }

  async bukaKunciPanitia(id: string) {
    await this.ambilPanitia(id);

    await this.prisma.user.update({
      where: { id },
      data: { loginGagal: 0, terkunciSampai: null },
    });

    return { status: 'success', message: 'Kunci login akun panitia dibuka.' };
  }
}
