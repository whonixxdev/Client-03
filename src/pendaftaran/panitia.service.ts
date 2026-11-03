import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MetodePembayaran, Prisma, Role, StatusRegistrasiUlang, StatusVerifikasi } from '@prisma/client';
import type { BiodataSiswa, Jurusan, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Workbook } from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DaftarUlangDto } from './dto/daftar-ulang.dto';
import { KonfirmasiPembayaranDto } from './dto/konfirmasi-pembayaran.dto';
import { KirimNotifikasiDto } from './dto/kirim-notifikasi.dto';
import { KomentarDto } from './dto/komentar.dto';
import { QueryPanitiaDto } from './dto/query-panitia.dto';
import { VerifikasiDto } from './dto/verifikasi.dto';
import { DAFTAR_JENIS, JENIS_BERKAS } from './utils/berkas.config';
import { cekKelengkapan } from './utils/kelengkapan.util';
import { olahThumbnail } from './utils/avatar.util';

type GambarExcel = Parameters<Workbook['addImage']>[0];

const MAKS_PENERIMA_NOTIFIKASI = 500;
const EKSPOR_MAKS_BARIS = 1000;
const EKSPOR_MAKS_DENGAN_FOTO = 400;

export interface AktorPanitia {
  id: string;
  role: Role;
}

const PILIHAN_DAFTAR = {
  id: true,
  email: true,
  username: true,
  createdAt: true,
  biodata: {
    select: {
      namaLengkap: true,
      nisn: true,
      noHpSiswa: true,
      asalSmp: true,
      statusFormulir: true,
      statusDaftarUlang: true,
      diajukanPada: true,
      avatarUrl: true,
      jurusan: { select: { id: true, namaJurusan: true } },
      jurusanCadangan: { select: { id: true, namaJurusan: true } },
      jurusanDiterima: { select: { id: true, namaJurusan: true } },
      gelombang: { select: { id: true, nama: true } },
    },
  },
  berkas: { select: { statusVerifikasi: true } },
  pembayaran: { select: { metode: true, jumlah: true, status: true } },
} satisfies Prisma.UserSelect;

const PILIHAN_EKSPOR = {
  email: true,
  username: true,
  createdAt: true,
  biodata: {
    include: {
      jurusan: { select: { namaJurusan: true } },
      jurusanCadangan: { select: { namaJurusan: true } },
      jurusanDiterima: { select: { namaJurusan: true } },
      gelombang: { select: { nama: true } },
    },
  },
  berkas: { select: { statusVerifikasi: true } },
  pembayaran: { select: { metode: true, jumlah: true, status: true } },
} satisfies Prisma.UserSelect;

const LABEL_DAFTAR_ULANG: Record<StatusRegistrasiUlang, string> = {
  BELUM_HADIR: 'belum hadir',
  HADIR_VERIFIKASI: 'hadir dan sedang diverifikasi',
  SUDAH_LENGKAP: 'sudah lengkap',
  ADA_KEKURANGAN: 'ada kekurangan berkas',
};

@Injectable()
export class PanitiaService {
  private readonly logger = new Logger(PanitiaService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  private buatFilter(query: QueryPanitiaDto): Prisma.UserWhereInput {
    const and: Prisma.UserWhereInput[] = [];

    if (query.search) {
      const kata = query.search.trim();
      and.push({
        OR: [
          { biodata: { is: { namaLengkap: { contains: kata, mode: 'insensitive' } } } },
          { biodata: { is: { nisn: { contains: kata } } } },
          { email: { contains: kata.toLowerCase() } },
          { username: { contains: kata, mode: 'insensitive' } },
        ],
      });
    }

    if (query.jurusanId) {
      and.push({
        biodata: {
          is: {
            OR: [
              { jurusanId: query.jurusanId },
              { jurusanCadanganId: query.jurusanId },
              { jurusanDiterimaId: query.jurusanId },
            ],
          },
        },
      });
    }

    const filterBiodata: Prisma.BiodataSiswaWhereInput = {};
    if (query.gelombangId) filterBiodata.gelombangId = query.gelombangId;
    if (query.statusFormulir) filterBiodata.statusFormulir = query.statusFormulir;
    if (query.statusDaftarUlang) filterBiodata.statusDaftarUlang = query.statusDaftarUlang;
    if (query.diajukan === true) filterBiodata.diajukanPada = { not: null };
    if (Object.keys(filterBiodata).length > 0) {
      and.push({ biodata: { is: filterBiodata } });
    }

    if (query.statusBerkas) {
      and.push({ berkas: { is: { statusVerifikasi: query.statusBerkas } } });
    }

    if (query.statusPembayaran) {
      and.push({ pembayaran: { is: { status: query.statusPembayaran } } });
    }

    return { role: Role.SISWA, isVerified: true, AND: and };
  }

  private async ambilData(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, role: Role.SISWA },
      select: { biodata: true, berkas: true, pembayaran: true },
    });

    if (!user || !user.biodata) {
      throw new NotFoundException('Data pendaftaran siswa tidak ditemukan.');
    }

    return { biodata: user.biodata, berkas: user.berkas, pembayaran: user.pembayaran };
  }

  private catat(
    db: Pick<PrismaClient, 'komentarPanitia'>,
    userId: string,
    aktor: AktorPanitia,
    kategori: string,
    pesan: string,
  ) {
    return db.komentarPanitia.create({
      data: { userId, panitiaId: aktor.id, kategori, pesan },
    });
  }

  private buatFilterEkspor(query: QueryPanitiaDto): Prisma.UserWhereInput {
    return {
      AND: [
        this.buatFilter(query),
        {
          biodata: {
            is: {
              statusFormulir: StatusVerifikasi.VALID,
              statusDaftarUlang: StatusRegistrasiUlang.SUDAH_LENGKAP,
            },
          },
        },
        { berkas: { is: { statusVerifikasi: StatusVerifikasi.VALID } } },
        { pembayaran: { is: { status: StatusVerifikasi.LUNAS } } },
      ],
    };
  }

  private async ambilThumbnail(daftarKey: Array<string | null>): Promise<Array<Buffer | null>> {
    const hasil: Array<Buffer | null> = daftarKey.map(() => null);
    const antrian = daftarKey.map((key, indeks) => ({ key, indeks }));

    const pekerja = async () => {
      while (antrian.length > 0) {
        const item = antrian.shift();
        if (!item || !item.key) {
          continue;
        }
        try {
          const asli = await this.storage.getBuffer(item.key, 'avatar');
          hasil[item.indeks] = await olahThumbnail(asli);
        } catch {
          hasil[item.indeks] = null;
        }
      }
    };

    await Promise.all(Array.from({ length: 8 }, () => pekerja()));
    return hasil;
  }

  private async urlAvatar(key: string | null | undefined): Promise<string | null> {
    return key ? this.storage.createSignedUrl(key, 3600, 'avatar') : null;
  }

  private async tentukanPenempatan(
    tx: Prisma.TransactionClient,
    biodata: BiodataSiswa,
  ): Promise<{ jurusan: Jurusan; pakaiCadangan: boolean }> {
    if (!biodata.jurusanId) {
      throw new BadRequestException('Siswa belum memilih jurusan utama.');
    }

    const idPilihan = [biodata.jurusanId, biodata.jurusanCadanganId].filter((id): id is string =>
      Boolean(id),
    );
    const idTerurut = [...new Set(idPilihan)].sort();

    for (const id of idTerurut) {
      await tx.$queryRaw`SELECT id FROM jurusans WHERE id = ${id} FOR UPDATE`;
    }

    const daftarJurusan = await tx.jurusan.findMany({ where: { id: { in: idPilihan } } });
    const utama = daftarJurusan.find((item) => item.id === biodata.jurusanId);
    const cadangan = biodata.jurusanCadanganId
      ? daftarJurusan.find((item) => item.id === biodata.jurusanCadanganId)
      : undefined;

    if (!utama) {
      throw new BadRequestException('Jurusan utama siswa tidak ditemukan.');
    }

    if (utama.aktif) {
      const terisiUtama = await tx.biodataSiswa.count({ where: { jurusanDiterimaId: utama.id } });
      if (terisiUtama < utama.kuota) {
        return { jurusan: utama, pakaiCadangan: false };
      }
    }

    if (cadangan && cadangan.aktif) {
      const terisiCadangan = await tx.biodataSiswa.count({
        where: { jurusanDiterimaId: cadangan.id },
      });
      if (terisiCadangan < cadangan.kuota) {
        return { jurusan: cadangan, pakaiCadangan: true };
      }
    }

    const namaJurusan = cadangan ? `${utama.namaJurusan} dan ${cadangan.namaJurusan}` : utama.namaJurusan;
    throw new ConflictException(
      `Kuota jurusan ${namaJurusan} sudah penuh. Minta siswa mengganti pilihan jurusan (status REVISI).`,
    );
  }

  private ringkasStatus(bagian: string, valid: boolean, catatan?: string): string {
    const dasar = valid ? `${bagian} dinyatakan valid.` : `${bagian} perlu direvisi.`;
    const tambahan = catatan?.trim() ? ` Catatan: ${catatan.trim()}` : '';
    return dasar + tambahan;
  }

  async getAll(query: QueryPanitiaDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buatFilter(query);

    const [total, baris] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: PILIHAN_DAFTAR,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = await Promise.all(
      baris.map(async (siswa) => ({
        ...siswa,
        biodata: siswa.biodata
          ? { ...siswa.biodata, avatarUrl: await this.urlAvatar(siswa.biodata.avatarUrl) }
          : null,
      })),
    );

    return {
      status: 'success',
      data,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async getDetail(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, role: Role.SISWA },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true,
        biodata: {
          include: {
            jurusan: true,
            jurusanCadangan: true,
            jurusanDiterima: true,
            gelombang: true,
          },
        },
        berkas: true,
        pembayaran: true,
        komentars: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!user) {
      throw new NotFoundException('Data siswa tidak ditemukan.');
    }

    const files = await Promise.all(
      DAFTAR_JENIS.map(async (jenis) => {
        const konfig = JENIS_BERKAS[jenis];
        const key = user.berkas ? user.berkas[konfig.field] : null;
        const url = key ? await this.storage.createSignedUrl(key) : null;
        return [
          jenis,
          { label: konfig.label, wajib: konfig.wajib, tersedia: Boolean(key), url },
        ] as const;
      }),
    );

    const buktiUrl = user.pembayaran?.buktiUrl
      ? await this.storage.createSignedUrl(user.pembayaran.buktiUrl)
      : null;

    return {
      status: 'success',
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.createdAt,
        biodata: user.biodata
          ? { ...user.biodata, avatarUrl: await this.urlAvatar(user.biodata.avatarUrl) }
          : null,
        berkas: user.berkas
          ? {
              statusVerifikasi: user.berkas.statusVerifikasi,
              catatanAdmin: user.berkas.catatanAdmin,
              files: Object.fromEntries(files),
            }
          : null,
        pembayaran: user.pembayaran
          ? {
              metode: user.pembayaran.metode,
              jumlah: user.pembayaran.jumlah,
              status: user.pembayaran.status,
              buktiUrl,
            }
          : null,
        kekurangan: user.biodata ? cekKelengkapan(user.biodata, user.berkas) : null,
        riwayat: user.komentars,
      },
    };
  }

  async verifikasi(aktor: AktorPanitia, userId: string, dto: VerifikasiDto) {
    if (!dto.statusFormulir && !dto.statusBerkas) {
      throw new BadRequestException('Isi minimal salah satu status verifikasi.');
    }

    const { biodata, berkas, pembayaran } = await this.ambilData(userId);

    if (biodata.diajukanPada === null) {
      throw new BadRequestException('Siswa belum mengajukan pendaftaran.');
    }

    if (pembayaran?.status === StatusVerifikasi.LUNAS) {
      throw new BadRequestException(
        'Pembayaran sudah lunas, status verifikasi tidak dapat diubah.',
      );
    }

    if (dto.statusBerkas && !berkas) {
      throw new BadRequestException('Siswa belum memiliki data berkas.');
    }

    const { biodataKurang, berkasKurang } = cekKelengkapan(biodata, berkas);

    if (dto.statusFormulir === StatusVerifikasi.VALID && biodataKurang.length > 0) {
      throw new BadRequestException({
        message: 'Biodata belum lengkap, tidak dapat dinyatakan valid.',
        biodataKurang,
      });
    }

    if (dto.statusBerkas === StatusVerifikasi.VALID && berkasKurang.length > 0) {
      throw new BadRequestException({
        message: 'Berkas belum lengkap, tidak dapat dinyatakan valid.',
        berkasKurang,
      });
    }

    if (dto.statusFormulir === StatusVerifikasi.REVISI && !dto.catatanFormulir?.trim()) {
      throw new BadRequestException('Catatan revisi formulir wajib diisi.');
    }

    if (dto.statusBerkas === StatusVerifikasi.REVISI && !dto.catatanAdmin?.trim()) {
      throw new BadRequestException('Catatan revisi berkas wajib diisi.');
    }

    const statusFormulirAkhir = dto.statusFormulir ?? biodata.statusFormulir;
    const statusBerkasAkhir = dto.statusBerkas ?? berkas?.statusVerifikasi ?? StatusVerifikasi.PENDING;
    const keduanyaValid =
      statusFormulirAkhir === StatusVerifikasi.VALID && statusBerkasAkhir === StatusVerifikasi.VALID;
    const adaRevisi =
      dto.statusFormulir === StatusVerifikasi.REVISI || dto.statusBerkas === StatusVerifikasi.REVISI;

    await this.prisma.$transaction(async (tx) => {
      if (dto.statusFormulir) {
        await tx.biodataSiswa.update({
          where: { userId },
          data: { statusFormulir: dto.statusFormulir },
        });
        await this.catat(
          tx,
          userId,
          aktor,
          'FORMULIR',
          this.ringkasStatus(
            'Formulir',
            dto.statusFormulir === StatusVerifikasi.VALID,
            dto.catatanFormulir,
          ),
        );
      }

      if (dto.statusBerkas) {
        await tx.berkasSiswa.update({
          where: { userId },
          data: {
            statusVerifikasi: dto.statusBerkas,
            catatanAdmin:
              dto.statusBerkas === StatusVerifikasi.REVISI ? dto.catatanAdmin?.trim() || null : null,
          },
        });
        await this.catat(
          tx,
          userId,
          aktor,
          'BERKAS',
          this.ringkasStatus('Berkas', dto.statusBerkas === StatusVerifikasi.VALID, dto.catatanAdmin),
        );
      }

      if (adaRevisi && biodata.jurusanDiterimaId) {
        await tx.biodataSiswa.update({ where: { userId }, data: { jurusanDiterimaId: null } });
        await this.catat(
          tx,
          userId,
          aktor,
          'FORMULIR',
          'Penempatan jurusan dilepas karena data perlu direvisi.',
        );
      }

      if (keduanyaValid && !biodata.jurusanDiterimaId) {
        const penempatan = await this.tentukanPenempatan(tx, biodata);
        await tx.biodataSiswa.update({
          where: { userId },
          data: { jurusanDiterimaId: penempatan.jurusan.id },
        });
        await this.catat(
          tx,
          userId,
          aktor,
          'FORMULIR',
          penempatan.pakaiCadangan
            ? `Jurusan utama penuh. Siswa ditempatkan di jurusan cadangan ${penempatan.jurusan.namaJurusan}.`
            : `Siswa ditempatkan di jurusan ${penempatan.jurusan.namaJurusan}.`,
        );
      }
    });

    return { status: 'success', message: 'Verifikasi berhasil disimpan.' };
  }

  async konfirmasiPembayaran(aktor: AktorPanitia, userId: string, dto: KonfirmasiPembayaranDto) {
    const { biodata, pembayaran } = await this.ambilData(userId);

    if (!pembayaran) {
      throw new NotFoundException('Siswa belum melakukan pembayaran.');
    }

    if (pembayaran.status === StatusVerifikasi.LUNAS && aktor.role !== Role.ADMIN) {
      throw new BadRequestException('Pembayaran sudah lunas. Hubungi admin untuk mengubah status.');
    }

    if (dto.status === 'REVISI' && !dto.catatan?.trim()) {
      throw new BadRequestException('Catatan wajib diisi saat pembayaran perlu diperbaiki.');
    }

    if (
      dto.status === 'REVISI' &&
      biodata.statusDaftarUlang !== StatusRegistrasiUlang.BELUM_HADIR
    ) {
      throw new BadRequestException(
        'Siswa sudah memulai registrasi ulang, status pembayaran tidak dapat diubah.',
      );
    }

    if (dto.status === 'LUNAS') {
      if (pembayaran.metode === MetodePembayaran.ONLINE && !pembayaran.buktiUrl) {
        throw new BadRequestException('Bukti pembayaran belum tersedia.');
      }
    }

    const pesan =
      dto.status === 'LUNAS'
        ? 'Pembayaran dikonfirmasi lunas.'
        : `Pembayaran perlu diperbaiki. Catatan: ${dto.catatan?.trim() ?? ''}`.trim();

    const [hasil] = await this.prisma.$transaction([
      this.prisma.pembayaran.update({
        where: { userId },
        data: { status: dto.status },
      }),
      this.catat(this.prisma, userId, aktor, 'PEMBAYARAN', pesan),
    ]);

    return {
      status: 'success',
      message: 'Status pembayaran berhasil diperbarui.',
      data: { metode: hasil.metode, jumlah: hasil.jumlah, status: hasil.status },
    };
  }

  async daftarUlang(aktor: AktorPanitia, userId: string, dto: DaftarUlangDto) {
    const { pembayaran } = await this.ambilData(userId);

    if (pembayaran?.status !== StatusVerifikasi.LUNAS) {
      throw new BadRequestException(
        'Registrasi ulang belum dapat diproses karena pembayaran belum lunas.',
      );
    }

    if (
      dto.statusDaftarUlang === StatusRegistrasiUlang.ADA_KEKURANGAN &&
      !dto.catatanDaftarUlang?.trim()
    ) {
      throw new BadRequestException('Catatan kekurangan berkas wajib diisi.');
    }

    const catatan = dto.catatanDaftarUlang?.trim() || null;
    const pesan = `Registrasi ulang: ${LABEL_DAFTAR_ULANG[dto.statusDaftarUlang]}.${
      catatan ? ` Catatan: ${catatan}` : ''
    }`;

    const [hasil] = await this.prisma.$transaction([
      this.prisma.biodataSiswa.update({
        where: { userId },
        data: { statusDaftarUlang: dto.statusDaftarUlang, catatanDaftarUlang: catatan },
        select: { statusDaftarUlang: true, catatanDaftarUlang: true },
      }),
      this.catat(this.prisma, userId, aktor, 'DAFTAR_ULANG', pesan),
    ]);

    return { status: 'success', message: 'Registrasi ulang berhasil dicatat.', data: hasil };
  }

  async kirimKomentar(aktor: AktorPanitia, userId: string, dto: KomentarDto) {
    await this.ambilData(userId);

    const pesan = dto.pesan.trim();
    if (!pesan) {
      throw new BadRequestException('Pesan wajib diisi.');
    }

    await this.catat(this.prisma, userId, aktor, 'PESAN', pesan);

    return { status: 'success', message: 'Pesan berhasil dikirim ke siswa.' };
  }

  async kirimNotifikasi(aktor: AktorPanitia, dto: KirimNotifikasiDto) {
    const adaIdSiswa = Boolean(dto.userIds && dto.userIds.length > 0);
    const adaFilter = Boolean(dto.filter);

    if (adaIdSiswa === adaFilter) {
      throw new BadRequestException('Isi salah satu saja: userIds atau filter.');
    }

    const pesan = dto.pesan.trim();
    if (!pesan) {
      throw new BadRequestException('Pesan wajib diisi.');
    }

    const pilihan = { id: true, biodata: { select: { namaLengkap: true } } } satisfies Prisma.UserSelect;
    let baris: Array<{ id: string; biodata: { namaLengkap: string } | null }>;

    if (adaIdSiswa) {
      baris = await this.prisma.user.findMany({
        where: { id: { in: dto.userIds }, role: Role.SISWA },
        select: pilihan,
      });
    } else {
      const where = this.buatFilter(dto.filter as QueryPanitiaDto);
      const total = await this.prisma.user.count({ where });
      if (total === 0) {
        throw new BadRequestException('Tidak ada siswa yang cocok dengan filter.');
      }
      if (total > MAKS_PENERIMA_NOTIFIKASI) {
        throw new BadRequestException(
          `Penerima melebihi ${MAKS_PENERIMA_NOTIFIKASI} siswa. Persempit filter.`,
        );
      }
      baris = await this.prisma.user.findMany({
        where,
        select: pilihan,
        take: MAKS_PENERIMA_NOTIFIKASI,
      });
    }

    if (baris.length === 0) {
      throw new BadRequestException('Penerima tidak ditemukan.');
    }

    if (dto.pratinjau === true) {
      return {
        status: 'success',
        pratinjau: true,
        data: {
          jumlahPenerima: baris.length,
          contohPenerima: baris.slice(0, 10).map((item) => item.biodata?.namaLengkap ?? item.id),
          pesan,
        },
      };
    }

    const batchId = baris.length > 1 ? randomUUID() : null;

    await this.prisma.komentarPanitia.createMany({
      data: baris.map((item) => ({
        userId: item.id,
        panitiaId: aktor.id,
        kategori: 'PESAN',
        pesan,
        batchId,
      })),
    });

    return {
      status: 'success',
      message: `Notifikasi terkirim ke ${baris.length} siswa.`,
      data: { jumlahPenerima: baris.length, batchId },
    };
  }

  async exportStatus(query: QueryPanitiaDto) {
    const [total, layak] = await this.prisma.$transaction([
      this.prisma.user.count({ where: this.buatFilter(query) }),
      this.prisma.user.count({ where: this.buatFilterEkspor(query) }),
    ]);

    return {
      status: 'success',
      data: {
        total,
        layak,
        belumSelesai: total - layak,
        bisaEkspor: layak > 0,
        syarat:
          'Formulir dan berkas VALID, pembayaran LUNAS, dan registrasi ulang SUDAH_LENGKAP.',
        maksBaris: EKSPOR_MAKS_BARIS,
        maksBarisDenganFoto: EKSPOR_MAKS_DENGAN_FOTO,
      },
    };
  }

  async exportExcel(aktor: AktorPanitia, query: QueryPanitiaDto): Promise<Buffer> {
    const where = this.buatFilterEkspor(query);
    const total = await this.prisma.user.count({ where });

    if (total === 0) {
      throw new BadRequestException(
        'Belum ada siswa yang siklusnya selesai (formulir dan berkas valid, pembayaran lunas, registrasi ulang lengkap).',
      );
    }

    if (total > EKSPOR_MAKS_BARIS) {
      throw new BadRequestException(
        `Data melebihi ${EKSPOR_MAKS_BARIS} siswa. Persempit dengan filter.`,
      );
    }

    const sertakanFoto = query.avatar !== false;
    if (sertakanFoto && total > EKSPOR_MAKS_DENGAN_FOTO) {
      throw new BadRequestException(
        `Ekspor dengan foto maksimal ${EKSPOR_MAKS_DENGAN_FOTO} siswa. Persempit filter atau tambahkan avatar=false.`,
      );
    }

    const data = await this.prisma.user.findMany({
      where,
      select: PILIHAN_EKSPOR,
      orderBy: { biodata: { namaLengkap: 'asc' } },
      take: EKSPOR_MAKS_BARIS,
    });

    this.logger.log(`Ekspor data pendaftar oleh ${aktor.id}: ${data.length} baris`);

    const thumbnail = sertakanFoto
      ? await this.ambilThumbnail(data.map((siswa) => siswa.biodata?.avatarUrl ?? null))
      : [];

    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Data Pendaftar');

    sheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Avatar', key: 'avatar', width: 10 },
      { header: 'Nama Lengkap', key: 'nama', width: 30 },
      { header: 'NISN', key: 'nisn', width: 14 },
      { header: 'Jurusan Utama', key: 'jurusanUtama', width: 24 },
      { header: 'Jurusan Cadangan', key: 'jurusanCadangan', width: 24 },
      { header: 'Jurusan Diterima', key: 'jurusanDiterima', width: 24 },
      { header: 'Gelombang', key: 'gelombang', width: 16 },
      { header: 'No HP Siswa', key: 'hpSiswa', width: 16 },
      { header: 'Asal Sekolah', key: 'asalSmp', width: 28 },
      { header: 'Status Pembayaran', key: 'statusBayar', width: 18 },
      { header: 'Metode Bayar', key: 'metode', width: 14 },
      { header: 'Jumlah Bayar', key: 'jumlah', width: 14 },
      { header: 'Status Registrasi Ulang', key: 'statusDaftarUlang', width: 24 },
      { header: 'Catatan Registrasi Ulang', key: 'catatanDaftarUlang', width: 36 },
      { header: 'NIS', key: 'nis', width: 14 },
      { header: 'NIK', key: 'nik', width: 20 },
      { header: 'Jenis Kelamin', key: 'jk', width: 14 },
      { header: 'Tempat Lahir', key: 'tempatLahir', width: 20 },
      { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 14 },
      { header: 'Agama', key: 'agama', width: 12 },
      { header: 'Alamat', key: 'alamat', width: 40 },
      { header: 'Nama Ayah', key: 'namaAyah', width: 24 },
      { header: 'No HP Ayah', key: 'hpAyah', width: 16 },
      { header: 'Nama Ibu', key: 'namaIbu', width: 24 },
      { header: 'No HP Ibu', key: 'hpIbu', width: 16 },
      { header: 'Status Formulir', key: 'statusFormulir', width: 16 },
      { header: 'Status Berkas', key: 'statusBerkas', width: 16 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Tanggal Daftar', key: 'tanggalDaftar', width: 16 },
    ];

    data.forEach((siswa, indeks) => {
      const biodata = siswa.biodata;
      sheet.addRow({
        no: indeks + 1,
        avatar: '',
        nama: biodata?.namaLengkap ?? '',
        nisn: biodata?.nisn ?? '',
        jurusanUtama: biodata?.jurusan?.namaJurusan ?? '',
        jurusanCadangan: biodata?.jurusanCadangan?.namaJurusan ?? '',
        jurusanDiterima: biodata?.jurusanDiterima?.namaJurusan ?? '',
        gelombang: biodata?.gelombang?.nama ?? '',
        hpSiswa: biodata?.noHpSiswa ?? '',
        asalSmp: biodata?.asalSmp ?? '',
        statusBayar: siswa.pembayaran?.status ?? '',
        metode: siswa.pembayaran?.metode ?? '',
        jumlah: siswa.pembayaran?.jumlah ?? '',
        statusDaftarUlang: biodata?.statusDaftarUlang ?? '',
        catatanDaftarUlang: biodata?.catatanDaftarUlang ?? '',
        nis: biodata?.nis ?? '',
        nik: biodata?.nik ?? '',
        jk: biodata?.jenisKelamin ?? '',
        tempatLahir: biodata?.tempatLahir ?? '',
        tanggalLahir: biodata?.tanggalLahir ? biodata.tanggalLahir.toISOString().slice(0, 10) : '',
        agama: biodata?.agama ?? '',
        alamat: biodata?.alamat ?? '',
        namaAyah: biodata?.namaAyah ?? '',
        hpAyah: biodata?.noHpAyah ?? '',
        namaIbu: biodata?.namaIbu ?? '',
        hpIbu: biodata?.noHpIbu ?? '',
        statusFormulir: biodata?.statusFormulir ?? '',
        statusBerkas: siswa.berkas?.statusVerifikasi ?? '',
        email: siswa.email,
        username: siswa.username ?? '',
        tanggalDaftar: siswa.createdAt.toISOString().slice(0, 10),
      });

      const gambar = thumbnail[indeks];
      if (gambar) {
        const idGambar = workbook.addImage({
          buffer: gambar,
          extension: 'jpeg',
        } as unknown as GambarExcel);
        sheet.addImage(idGambar, {
          tl: { col: 1, row: indeks + 1 },
          ext: { width: 48, height: 48 },
        });
        sheet.getRow(indeks + 2).height = 40;
      }
    });

    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 3 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length },
    };

    const hasil = await workbook.xlsx.writeBuffer();
    return Buffer.from(hasil as ArrayBuffer);
  }
}
