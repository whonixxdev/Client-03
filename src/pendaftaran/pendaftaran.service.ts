import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { MetodePembayaran, StatusVerifikasi } from '@prisma/client';
import type { BerkasSiswa } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { KonfigurasiService } from '../configuration/konfigurasi.service';
import { isUniqueViolation } from '../auth/utils/security.util';
import { CreateBiodataDto } from './dto/biodata.dto';
import { CreatePembayaranDto } from './dto/pembayaran.dto';
import {
  AVATAR,
  BUKTI_PEMBAYARAN,
  DAFTAR_JENIS,
  JENIS_BERKAS,
  isJenisBerkas,
} from './utils/berkas.config';
import type { BerkasField } from './utils/berkas.config';
import { olahAvatar } from './utils/avatar.util';
import { slugify, validateFile } from './utils/file.util';
import { cekKelengkapan } from './utils/kelengkapan.util';

@Injectable()
export class PendaftaranService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private konfigurasi: KonfigurasiService,
  ) {}

  private bisaEdit(diajukanPada: Date | null, status: StatusVerifikasi): boolean {
    return diajukanPada === null || status === StatusVerifikasi.REVISI;
  }

  private buatFolder(userId: string, namaLengkap: string): string {
    return `siswa/${slugify(namaLengkap)}-${userId.slice(0, 8)}`;
  }

  private parseTanggalLahir(value: string): Date {
    const tanggal = new Date(value);
    if (Number.isNaN(tanggal.getTime())) {
      throw new BadRequestException('Tanggal lahir tidak valid.');
    }
    const umur = (Date.now() - tanggal.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (umur < 10 || umur > 25) {
      throw new BadRequestException('Tanggal lahir tidak sesuai untuk calon siswa.');
    }
    return tanggal;
  }

  private async bangunDaftarFile(berkas: BerkasSiswa | null) {
    const hasil = await Promise.all(
      DAFTAR_JENIS.map(async (jenis) => {
        const konfig = JENIS_BERKAS[jenis];
        const key = berkas ? berkas[konfig.field] : null;
        const url = key ? await this.storage.createSignedUrl(key) : null;
        return [
          jenis,
          { label: konfig.label, wajib: konfig.wajib, tersedia: Boolean(key), url },
        ] as const;
      }),
    );
    return Object.fromEntries(hasil);
  }

  async getMyPendaftaran(userId: string) {
    const pilihJurusan = { select: { id: true, namaJurusan: true, biayaPendaftaran: true } };

    const [biodata, berkas, pembayaran, catatan, belumDibaca, pengaturan] = await Promise.all([
      this.prisma.biodataSiswa.findUnique({
        where: { userId },
        include: {
          jurusan: pilihJurusan,
          jurusanCadangan: pilihJurusan,
          jurusanDiterima: pilihJurusan,
          gelombang: { select: { id: true, nama: true } },
        },
      }),
      this.prisma.berkasSiswa.findUnique({ where: { userId } }),
      this.prisma.pembayaran.findUnique({ where: { userId } }),
      this.prisma.komentarPanitia.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, kategori: true, pesan: true, dibacaPada: true, createdAt: true },
      }),
      this.prisma.komentarPanitia.count({ where: { userId, dibacaPada: null } }),
      this.konfigurasi.ambilPengaturan(),
    ]);

    const files = await this.bangunDaftarFile(berkas);
    const avatarUrl = biodata?.avatarUrl
      ? await this.storage.createSignedUrl(biodata.avatarUrl, 3600, 'avatar')
      : null;
    const buktiUrl = pembayaran?.buktiUrl
      ? await this.storage.createSignedUrl(pembayaran.buktiUrl)
      : null;

    const formulirValid = biodata?.statusFormulir === StatusVerifikasi.VALID;
    const berkasValid = berkas?.statusVerifikasi === StatusVerifikasi.VALID;
    const statusBerkas = berkas?.statusVerifikasi ?? StatusVerifikasi.PENDING;
    const pembayaranTerbuka = formulirValid && berkasValid;
    const daftarUlangTerbuka = pembayaran?.status === StatusVerifikasi.LUNAS;

    const biodataBisaDiedit = biodata
      ? this.bisaEdit(biodata.diajukanPada, biodata.statusFormulir)
      : false;
    const berkasBisaDiedit = biodata ? this.bisaEdit(biodata.diajukanPada, statusBerkas) : false;
    const bisaMengajukan = biodata
      ? biodata.diajukanPada === null ||
        biodata.statusFormulir === StatusVerifikasi.REVISI ||
        statusBerkas === StatusVerifikasi.REVISI
      : false;

    return {
      status: 'success',
      data: {
        biodata: biodata ? { ...biodata, avatarUrl } : null,
        berkas: berkas
          ? { statusVerifikasi: berkas.statusVerifikasi, catatanAdmin: berkas.catatanAdmin, files }
          : null,
        pembayaran: pembayaran
          ? {
              metode: pembayaran.metode,
              jumlah: pembayaran.jumlah,
              status: pembayaran.status,
              buktiUrl,
            }
          : null,
        biayaPendaftaran:
          biodata?.jurusanDiterima?.biayaPendaftaran ?? biodata?.jurusan?.biayaPendaftaran ?? null,
        kekurangan: biodata ? cekKelengkapan(biodata, berkas) : null,
        akses: {
          biodataBisaDiedit,
          berkasBisaDiedit,
          bisaMengajukan,
          pembayaranTerbuka,
          daftarUlangTerbuka,
        },
        infoPembayaran: pembayaranTerbuka
          ? {
              bankNama: pengaturan.bankNama,
              nomorRekening: pengaturan.bankNomorRekening,
              atasNama: pengaturan.bankAtasNama,
              instruksiOffline: pengaturan.instruksiPembayaranOffline,
            }
          : null,
        instruksiRegistrasiUlang: daftarUlangTerbuka ? pengaturan.instruksiRegistrasiUlang : null,
        catatanPanitia: catatan,
        notifikasiBelumDibaca: belumDibaca,
      },
    };
  }

  async upsertBiodata(userId: string, dto: CreateBiodataDto) {
    const existing = await this.prisma.biodataSiswa.findUnique({ where: { userId } });

    if (existing && !this.bisaEdit(existing.diajukanPada, existing.statusFormulir)) {
      throw new BadRequestException(
        'Biodata sedang diverifikasi atau sudah divalidasi, tidak dapat diubah.',
      );
    }

    const idUtama = dto.jurusanId ?? existing?.jurusanId ?? null;
    const idCadangan = dto.jurusanCadanganId ?? existing?.jurusanCadanganId ?? null;
    if (idUtama && idCadangan && idUtama === idCadangan) {
      throw new BadRequestException('Jurusan cadangan tidak boleh sama dengan jurusan utama.');
    }

    const idJurusan = [dto.jurusanId, dto.jurusanCadanganId].filter((id): id is string =>
      Boolean(id),
    );
    if (idJurusan.length > 0) {
      const ditemukan = await this.prisma.jurusan.count({
        where: { id: { in: idJurusan }, aktif: true },
      });
      if (ditemukan !== new Set(idJurusan).size) {
        throw new BadRequestException('Jurusan tidak ditemukan atau tidak aktif.');
      }
    }

    const data = {
      namaLengkap: dto.namaLengkap.trim(),
      nik: dto.nik,
      nisn: dto.nisn,
      nis: dto.nis,
      jenisKelamin: dto.jenisKelamin,
      tempatLahir: dto.tempatLahir?.trim(),
      tanggalLahir: dto.tanggalLahir ? this.parseTanggalLahir(dto.tanggalLahir) : undefined,
      agama: dto.agama,
      alamat: dto.alamat?.trim(),
      noHpSiswa: dto.noHpSiswa,
      namaAyah: dto.namaAyah?.trim(),
      noHpAyah: dto.noHpAyah,
      namaIbu: dto.namaIbu?.trim(),
      noHpIbu: dto.noHpIbu,
      asalSmp: dto.asalSmp?.trim(),
      jurusanId: dto.jurusanId,
      jurusanCadanganId: dto.jurusanCadanganId,
    };

    try {
      const biodata = await this.prisma.biodataSiswa.upsert({
        where: { userId },
        update: data,
        create: { userId, ...data },
      });
      return { status: 'success', message: 'Biodata berhasil disimpan.', data: biodata };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('NIK atau NISN sudah terdaftar pada siswa lain.');
      }
      throw error;
    }
  }

  async uploadAvatar(userId: string, file: Express.Multer.File | undefined) {
    const biodata = await this.prisma.biodataSiswa.findUnique({ where: { userId } });

    if (!biodata) {
      throw new BadRequestException('Biodata belum tersedia.');
    }

    if (!this.bisaEdit(biodata.diajukanPada, biodata.statusFormulir)) {
      throw new BadRequestException(
        'Foto profil tidak dapat diubah karena data sedang diverifikasi atau sudah divalidasi.',
      );
    }

    const valid = validateFile(file, AVATAR.maxBytes, AVATAR.tipe);
    const hasil = await olahAvatar(valid.buffer);
    const key = `avatar/${userId}.jpg`;

    await this.storage.upload(key, hasil, 'image/jpeg', 'avatar');
    await this.prisma.biodataSiswa.update({ where: { userId }, data: { avatarUrl: key } });

    return {
      status: 'success',
      message: 'Foto profil berhasil diunggah.',
      data: { url: await this.storage.createSignedUrl(key, 3600, 'avatar') },
    };
  }

  async uploadBerkas(userId: string, jenis: string, file: Express.Multer.File | undefined) {
    if (!isJenisBerkas(jenis)) {
      throw new BadRequestException('Jenis berkas tidak dikenal.');
    }
    const konfig = JENIS_BERKAS[jenis];

    const [biodata, berkas] = await Promise.all([
      this.prisma.biodataSiswa.findUnique({ where: { userId } }),
      this.prisma.berkasSiswa.findUnique({ where: { userId } }),
    ]);

    if (!biodata) {
      throw new BadRequestException('Biodata belum tersedia.');
    }

    const statusBerkas = berkas?.statusVerifikasi ?? StatusVerifikasi.PENDING;
    if (!this.bisaEdit(biodata.diajukanPada, statusBerkas)) {
      throw new BadRequestException(
        'Berkas sedang diverifikasi atau sudah divalidasi, tidak dapat diubah.',
      );
    }

    const valid = validateFile(file, konfig.maxBytes, konfig.tipe);
    const folder = berkas?.folderPath ?? this.buatFolder(userId, biodata.namaLengkap);
    const key = `${folder}/${jenis}.${valid.ext}`;
    const keyLama = berkas ? berkas[konfig.field] : null;

    await this.storage.upload(key, valid.buffer, valid.mime);

    const fileData: Partial<Record<BerkasField, string>> = {};
    fileData[konfig.field] = key;

    await this.prisma.berkasSiswa.upsert({
      where: { userId },
      update: { ...fileData, folderPath: folder },
      create: { userId, folderPath: folder, ...fileData },
    });

    if (keyLama && keyLama !== key) {
      await this.storage.remove(keyLama);
    }

    return {
      status: 'success',
      message: `${konfig.label} berhasil diunggah.`,
      data: { jenis, url: await this.storage.createSignedUrl(key) },
    };
  }

  async ajukan(userId: string) {
    const [biodata, berkas] = await Promise.all([
      this.prisma.biodataSiswa.findUnique({ where: { userId } }),
      this.prisma.berkasSiswa.findUnique({ where: { userId } }),
    ]);

    if (!biodata) {
      throw new BadRequestException('Biodata belum tersedia.');
    }

    const statusBerkas = berkas?.statusVerifikasi ?? StatusVerifikasi.PENDING;
    const adaPerbaikan =
      biodata.statusFormulir === StatusVerifikasi.REVISI ||
      statusBerkas === StatusVerifikasi.REVISI;

    if (biodata.diajukanPada !== null && !adaPerbaikan) {
      throw new BadRequestException('Pendaftaran sudah diajukan dan sedang diproses.');
    }

    const { biodataKurang, berkasKurang } = cekKelengkapan(biodata, berkas);
    if (biodataKurang.length > 0 || berkasKurang.length > 0) {
      throw new BadRequestException({
        message: 'Data atau berkas belum lengkap.',
        biodataKurang,
        berkasKurang,
      });
    }

    if (!berkas) {
      throw new BadRequestException('Data berkas belum tersedia.');
    }

    const gelombangId = biodata.gelombangId ?? (await this.konfigurasi.cariGelombangAktif());

    await this.prisma.$transaction([
      this.prisma.biodataSiswa.update({
        where: { userId },
        data: {
          diajukanPada: new Date(),
          gelombangId,
          statusFormulir:
            biodata.statusFormulir === StatusVerifikasi.REVISI
              ? StatusVerifikasi.PENDING
              : biodata.statusFormulir,
        },
      }),
      this.prisma.berkasSiswa.update({
        where: { userId },
        data: {
          statusVerifikasi:
            berkas.statusVerifikasi === StatusVerifikasi.REVISI
              ? StatusVerifikasi.PENDING
              : berkas.statusVerifikasi,
        },
      }),
    ]);

    return {
      status: 'success',
      message: 'Pendaftaran berhasil diajukan dan menunggu verifikasi panitia.',
    };
  }

  async submitPembayaran(
    userId: string,
    dto: CreatePembayaranDto,
    bukti: Express.Multer.File | undefined,
  ) {
    const [biodata, berkas, pembayaran] = await Promise.all([
      this.prisma.biodataSiswa.findUnique({
        where: { userId },
        include: { jurusanDiterima: true },
      }),
      this.prisma.berkasSiswa.findUnique({ where: { userId } }),
      this.prisma.pembayaran.findUnique({ where: { userId } }),
    ]);

    if (!berkas || berkas.statusVerifikasi !== StatusVerifikasi.VALID) {
      throw new BadRequestException(
        'Pembayaran terkunci. Berkas belum diverifikasi atau divalidasi oleh panitia.',
      );
    }

    if (!biodata || biodata.statusFormulir !== StatusVerifikasi.VALID) {
      throw new BadRequestException('Pembayaran terkunci. Biodata belum divalidasi oleh panitia.');
    }

    if (!biodata.jurusanDiterima) {
      throw new BadRequestException(
        'Penempatan jurusan belum ditetapkan. Silakan hubungi panitia.',
      );
    }

    if (pembayaran?.status === StatusVerifikasi.LUNAS) {
      throw new BadRequestException('Pembayaran sudah lunas.');
    }

    if (dto.metode === MetodePembayaran.OFFLINE && bukti) {
      throw new BadRequestException('Pembayaran offline tidak memerlukan bukti pembayaran.');
    }

    if (dto.metode === MetodePembayaran.ONLINE && !bukti) {
      throw new BadRequestException('Bukti pembayaran wajib diunggah untuk pembayaran online.');
    }

    let buktiKey: string | null = null;
    if (dto.metode === MetodePembayaran.ONLINE) {
      const valid = validateFile(bukti, BUKTI_PEMBAYARAN.maxBytes, BUKTI_PEMBAYARAN.tipe);
      const folder = berkas.folderPath ?? this.buatFolder(userId, biodata.namaLengkap);
      buktiKey = `${folder}/bukti-pembayaran.${valid.ext}`;
      await this.storage.upload(buktiKey, valid.buffer, valid.mime);
    }

    const jumlah = biodata.jurusanDiterima.biayaPendaftaran;

    const hasil = await this.prisma.pembayaran.upsert({
      where: { userId },
      update: {
        metode: dto.metode,
        jumlah,
        buktiUrl: buktiKey,
        status: StatusVerifikasi.PENDING,
      },
      create: {
        userId,
        metode: dto.metode,
        jumlah,
        buktiUrl: buktiKey,
        status: StatusVerifikasi.PENDING,
      },
    });

    if (pembayaran?.buktiUrl && pembayaran.buktiUrl !== buktiKey) {
      await this.storage.remove(pembayaran.buktiUrl);
    }

    return {
      status: 'success',
      message:
        dto.metode === MetodePembayaran.ONLINE
          ? 'Bukti pembayaran berhasil dikirim dan menunggu konfirmasi panitia.'
          : 'Pembayaran offline dicatat. Silakan membayar langsung di sekolah.',
      data: { metode: hasil.metode, jumlah: hasil.jumlah, status: hasil.status },
    };
  }
}
