import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isUniqueViolation } from '../auth/utils/security.util';
import { CreateJurusanDto, UpdateJurusanDto } from './dto/jurusan.dto';
import { CreateGelombangDto, UpdateGelombangDto } from './dto/gelombang.dto';
import { PengaturanDto } from './dto/pengaturan.dto';

export const KUNCI_PENGATURAN = [
  'bankNama',
  'bankNomorRekening',
  'bankAtasNama',
  'instruksiPembayaranOffline',
  'instruksiRegistrasiUlang',
] as const;

export type KunciPengaturan = (typeof KUNCI_PENGATURAN)[number];

export type NilaiPengaturan = Record<KunciPengaturan, string | null>;

function awalHari(value: string): Date {
  return value.length === 10 ? new Date(`${value}T00:00:00.000+08:00`) : new Date(value);
}

function akhirHari(value: string): Date {
  return value.length === 10 ? new Date(`${value}T23:59:59.999+08:00`) : new Date(value);
}

@Injectable()
export class KonfigurasiService {
  constructor(private prisma: PrismaService) {}

  async daftarJurusan(hanyaAktif: boolean) {
    const [jurusan, terisi] = await Promise.all([
      this.prisma.jurusan.findMany({
        where: hanyaAktif ? { aktif: true } : {},
        orderBy: { namaJurusan: 'asc' },
      }),
      this.prisma.biodataSiswa.groupBy({
        by: ['jurusanDiterimaId'],
        where: { jurusanDiterimaId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const peta = new Map<string | null, number>(
      terisi.map((item) => [item.jurusanDiterimaId, item._count._all]),
    );

    const data = jurusan.map((item) => {
      const jumlahTerisi = peta.get(item.id) ?? 0;
      return {
        id: item.id,
        namaJurusan: item.namaJurusan,
        kuota: item.kuota,
        biayaPendaftaran: item.biayaPendaftaran,
        aktif: item.aktif,
        terisi: jumlahTerisi,
        sisaKuota: Math.max(0, item.kuota - jumlahTerisi),
      };
    });

    return { status: 'success', data };
  }

  async buatJurusan(dto: CreateJurusanDto) {
    try {
      const jurusan = await this.prisma.jurusan.create({
        data: {
          namaJurusan: dto.namaJurusan.trim(),
          kuota: dto.kuota,
          biayaPendaftaran: dto.biayaPendaftaran,
          aktif: dto.aktif ?? true,
        },
      });
      return { status: 'success', message: 'Jurusan berhasil dibuat.', data: jurusan };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Nama jurusan sudah ada.');
      }
      throw error;
    }
  }

  async ubahJurusan(id: string, dto: UpdateJurusanDto) {
    const jurusan = await this.prisma.jurusan.findUnique({ where: { id } });
    if (!jurusan) {
      throw new NotFoundException('Jurusan tidak ditemukan.');
    }

    if (dto.kuota !== undefined) {
      const terisi = await this.prisma.biodataSiswa.count({ where: { jurusanDiterimaId: id } });
      if (dto.kuota < terisi) {
        throw new BadRequestException(
          `Kuota tidak boleh lebih kecil dari jumlah siswa yang sudah ditempatkan (${terisi}).`,
        );
      }
    }

    try {
      const diperbarui = await this.prisma.jurusan.update({
        where: { id },
        data: {
          namaJurusan: dto.namaJurusan?.trim(),
          kuota: dto.kuota,
          biayaPendaftaran: dto.biayaPendaftaran,
          aktif: dto.aktif,
        },
      });
      return { status: 'success', message: 'Jurusan berhasil diperbarui.', data: diperbarui };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Nama jurusan sudah ada.');
      }
      throw error;
    }
  }

  async hapusJurusan(id: string) {
    const jurusan = await this.prisma.jurusan.findUnique({ where: { id } });
    if (!jurusan) {
      throw new NotFoundException('Jurusan tidak ditemukan.');
    }

    const dipakai = await this.prisma.biodataSiswa.count({
      where: {
        OR: [{ jurusanId: id }, { jurusanCadanganId: id }, { jurusanDiterimaId: id }],
      },
    });
    if (dipakai > 0) {
      throw new ConflictException(
        'Jurusan sudah dipilih oleh siswa dan tidak dapat dihapus. Nonaktifkan jurusan ini.',
      );
    }

    await this.prisma.jurusan.delete({ where: { id } });
    return { status: 'success', message: 'Jurusan berhasil dihapus.' };
  }

  async daftarGelombang() {
    const data = await this.prisma.gelombangPendaftaran.findMany({
      orderBy: { tanggalMulai: 'asc' },
      include: { _count: { select: { biodatas: true } } },
    });
    return {
      status: 'success',
      data: data.map(({ _count, ...item }) => ({ ...item, jumlahSiswa: _count.biodatas })),
    };
  }

  async buatGelombang(dto: CreateGelombangDto) {
    const mulai = awalHari(dto.tanggalMulai);
    const selesai = akhirHari(dto.tanggalSelesai);
    if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime()) || selesai <= mulai) {
      throw new BadRequestException('Tanggal selesai harus setelah tanggal mulai.');
    }

    try {
      const gelombang = await this.prisma.gelombangPendaftaran.create({
        data: {
          nama: dto.nama.trim(),
          tanggalMulai: mulai,
          tanggalSelesai: selesai,
          aktif: dto.aktif ?? true,
        },
      });
      return { status: 'success', message: 'Gelombang berhasil dibuat.', data: gelombang };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Nama gelombang sudah ada.');
      }
      throw error;
    }
  }

  async ubahGelombang(id: string, dto: UpdateGelombangDto) {
    const gelombang = await this.prisma.gelombangPendaftaran.findUnique({ where: { id } });
    if (!gelombang) {
      throw new NotFoundException('Gelombang tidak ditemukan.');
    }

    const mulai = dto.tanggalMulai ? awalHari(dto.tanggalMulai) : gelombang.tanggalMulai;
    const selesai = dto.tanggalSelesai ? akhirHari(dto.tanggalSelesai) : gelombang.tanggalSelesai;
    if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime()) || selesai <= mulai) {
      throw new BadRequestException('Tanggal selesai harus setelah tanggal mulai.');
    }

    try {
      const diperbarui = await this.prisma.gelombangPendaftaran.update({
        where: { id },
        data: {
          nama: dto.nama?.trim(),
          tanggalMulai: mulai,
          tanggalSelesai: selesai,
          aktif: dto.aktif,
        },
      });
      return { status: 'success', message: 'Gelombang berhasil diperbarui.', data: diperbarui };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Nama gelombang sudah ada.');
      }
      throw error;
    }
  }

  async hapusGelombang(id: string) {
    const gelombang = await this.prisma.gelombangPendaftaran.findUnique({ where: { id } });
    if (!gelombang) {
      throw new NotFoundException('Gelombang tidak ditemukan.');
    }

    const dipakai = await this.prisma.biodataSiswa.count({ where: { gelombangId: id } });
    if (dipakai > 0) {
      throw new ConflictException(
        'Gelombang sudah dipakai oleh siswa dan tidak dapat dihapus. Nonaktifkan gelombang ini.',
      );
    }

    await this.prisma.gelombangPendaftaran.delete({ where: { id } });
    return { status: 'success', message: 'Gelombang berhasil dihapus.' };
  }

  async cariGelombangAktif(): Promise<string | null> {
    const total = await this.prisma.gelombangPendaftaran.count();
    if (total === 0) {
      return null;
    }

    const sekarang = new Date();
    const gelombang = await this.prisma.gelombangPendaftaran.findFirst({
      where: {
        aktif: true,
        tanggalMulai: { lte: sekarang },
        tanggalSelesai: { gte: sekarang },
      },
      orderBy: { tanggalMulai: 'asc' },
    });

    if (!gelombang) {
      throw new BadRequestException('Pendaftaran belum dibuka atau sudah ditutup.');
    }

    return gelombang.id;
  }

  async ambilPengaturan(): Promise<NilaiPengaturan> {
    const baris = await this.prisma.pengaturan.findMany({
      where: { kunci: { in: [...KUNCI_PENGATURAN] } },
    });

    const hasil = Object.fromEntries(
      KUNCI_PENGATURAN.map((kunci) => [kunci, null]),
    ) as NilaiPengaturan;

    for (const item of baris) {
      hasil[item.kunci as KunciPengaturan] = item.nilai;
    }

    return hasil;
  }

  async daftarPengaturan() {
    return { status: 'success', data: await this.ambilPengaturan() };
  }

  async ubahPengaturan(dto: PengaturanDto) {
    const operasi = KUNCI_PENGATURAN.filter((kunci) => dto[kunci] !== undefined).map((kunci) =>
      this.prisma.pengaturan.upsert({
        where: { kunci },
        update: { nilai: dto[kunci] as string },
        create: { kunci, nilai: dto[kunci] as string },
      }),
    );

    if (operasi.length === 0) {
      throw new BadRequestException('Tidak ada pengaturan yang diubah.');
    }

    await this.prisma.$transaction(operasi);

    return {
      status: 'success',
      message: 'Pengaturan berhasil disimpan.',
      data: await this.ambilPengaturan(),
    };
  }
}
