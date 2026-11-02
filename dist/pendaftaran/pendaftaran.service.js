"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendaftaranService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const konfigurasi_service_1 = require("../configuration/konfigurasi.service");
const security_util_1 = require("../auth/utils/security.util");
const berkas_config_1 = require("./utils/berkas.config");
const avatar_util_1 = require("./utils/avatar.util");
const file_util_1 = require("./utils/file.util");
const kelengkapan_util_1 = require("./utils/kelengkapan.util");
let PendaftaranService = class PendaftaranService {
    prisma;
    storage;
    konfigurasi;
    constructor(prisma, storage, konfigurasi) {
        this.prisma = prisma;
        this.storage = storage;
        this.konfigurasi = konfigurasi;
    }
    bisaEdit(diajukanPada, status) {
        return diajukanPada === null || status === client_1.StatusVerifikasi.REVISI;
    }
    buatFolder(userId, namaLengkap) {
        return `siswa/${(0, file_util_1.slugify)(namaLengkap)}-${userId.slice(0, 8)}`;
    }
    parseTanggalLahir(value) {
        const tanggal = new Date(value);
        if (Number.isNaN(tanggal.getTime())) {
            throw new common_1.BadRequestException('Tanggal lahir tidak valid.');
        }
        const umur = (Date.now() - tanggal.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (umur < 10 || umur > 25) {
            throw new common_1.BadRequestException('Tanggal lahir tidak sesuai untuk calon siswa.');
        }
        return tanggal;
    }
    async bangunDaftarFile(berkas) {
        const hasil = await Promise.all(berkas_config_1.DAFTAR_JENIS.map(async (jenis) => {
            const konfig = berkas_config_1.JENIS_BERKAS[jenis];
            const key = berkas ? berkas[konfig.field] : null;
            const url = key ? await this.storage.createSignedUrl(key) : null;
            return [
                jenis,
                { label: konfig.label, wajib: konfig.wajib, tersedia: Boolean(key), url },
            ];
        }));
        return Object.fromEntries(hasil);
    }
    async getMyPendaftaran(userId) {
        const pilihJurusan = { select: { id: true, namaJurusan: true, biayaPendaftaran: true } };
        const [biodata, berkas, pembayaran, catatan, pengaturan] = await Promise.all([
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
                select: { kategori: true, pesan: true, createdAt: true },
            }),
            this.konfigurasi.ambilPengaturan(),
        ]);
        const files = await this.bangunDaftarFile(berkas);
        const avatarUrl = biodata?.avatarUrl
            ? await this.storage.createSignedUrl(biodata.avatarUrl, 300, 'avatar')
            : null;
        const buktiUrl = pembayaran?.buktiUrl
            ? await this.storage.createSignedUrl(pembayaran.buktiUrl)
            : null;
        const formulirValid = biodata?.statusFormulir === client_1.StatusVerifikasi.VALID;
        const berkasValid = berkas?.statusVerifikasi === client_1.StatusVerifikasi.VALID;
        const statusBerkas = berkas?.statusVerifikasi ?? client_1.StatusVerifikasi.PENDING;
        const pembayaranTerbuka = formulirValid && berkasValid;
        const daftarUlangTerbuka = pembayaran?.status === client_1.StatusVerifikasi.LUNAS;
        const biodataBisaDiedit = biodata
            ? this.bisaEdit(biodata.diajukanPada, biodata.statusFormulir)
            : false;
        const berkasBisaDiedit = biodata ? this.bisaEdit(biodata.diajukanPada, statusBerkas) : false;
        const bisaMengajukan = biodata
            ? biodata.diajukanPada === null ||
                biodata.statusFormulir === client_1.StatusVerifikasi.REVISI ||
                statusBerkas === client_1.StatusVerifikasi.REVISI
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
                biayaPendaftaran: biodata?.jurusanDiterima?.biayaPendaftaran ?? biodata?.jurusan?.biayaPendaftaran ?? null,
                kekurangan: biodata ? (0, kelengkapan_util_1.cekKelengkapan)(biodata, berkas) : null,
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
            },
        };
    }
    async upsertBiodata(userId, dto) {
        const existing = await this.prisma.biodataSiswa.findUnique({ where: { userId } });
        if (existing && !this.bisaEdit(existing.diajukanPada, existing.statusFormulir)) {
            throw new common_1.BadRequestException('Biodata sedang diverifikasi atau sudah divalidasi, tidak dapat diubah.');
        }
        const idUtama = dto.jurusanId ?? existing?.jurusanId ?? null;
        const idCadangan = dto.jurusanCadanganId ?? existing?.jurusanCadanganId ?? null;
        if (idUtama && idCadangan && idUtama === idCadangan) {
            throw new common_1.BadRequestException('Jurusan cadangan tidak boleh sama dengan jurusan utama.');
        }
        const idJurusan = [dto.jurusanId, dto.jurusanCadanganId].filter((id) => Boolean(id));
        if (idJurusan.length > 0) {
            const ditemukan = await this.prisma.jurusan.count({
                where: { id: { in: idJurusan }, aktif: true },
            });
            if (ditemukan !== new Set(idJurusan).size) {
                throw new common_1.BadRequestException('Jurusan tidak ditemukan atau tidak aktif.');
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
        }
        catch (error) {
            if ((0, security_util_1.isUniqueViolation)(error)) {
                throw new common_1.ConflictException('NIK atau NISN sudah terdaftar pada siswa lain.');
            }
            throw error;
        }
    }
    async uploadAvatar(userId, file) {
        const biodata = await this.prisma.biodataSiswa.findUnique({ where: { userId } });
        if (!biodata) {
            throw new common_1.BadRequestException('Biodata belum tersedia.');
        }
        if (!this.bisaEdit(biodata.diajukanPada, biodata.statusFormulir)) {
            throw new common_1.BadRequestException('Foto profil tidak dapat diubah karena data sedang diverifikasi atau sudah divalidasi.');
        }
        const valid = (0, file_util_1.validateFile)(file, berkas_config_1.AVATAR.maxBytes, berkas_config_1.AVATAR.tipe);
        const hasil = await (0, avatar_util_1.olahAvatar)(valid.buffer);
        const key = `avatar/${userId}.jpg`;
        await this.storage.upload(key, hasil, 'image/jpeg', 'avatar');
        await this.prisma.biodataSiswa.update({ where: { userId }, data: { avatarUrl: key } });
        return {
            status: 'success',
            message: 'Foto profil berhasil diunggah.',
            data: { url: await this.storage.createSignedUrl(key, 300, 'avatar') },
        };
    }
    async uploadBerkas(userId, jenis, file) {
        if (!(0, berkas_config_1.isJenisBerkas)(jenis)) {
            throw new common_1.BadRequestException('Jenis berkas tidak dikenal.');
        }
        const konfig = berkas_config_1.JENIS_BERKAS[jenis];
        const [biodata, berkas] = await Promise.all([
            this.prisma.biodataSiswa.findUnique({ where: { userId } }),
            this.prisma.berkasSiswa.findUnique({ where: { userId } }),
        ]);
        if (!biodata) {
            throw new common_1.BadRequestException('Biodata belum tersedia.');
        }
        const statusBerkas = berkas?.statusVerifikasi ?? client_1.StatusVerifikasi.PENDING;
        if (!this.bisaEdit(biodata.diajukanPada, statusBerkas)) {
            throw new common_1.BadRequestException('Berkas sedang diverifikasi atau sudah divalidasi, tidak dapat diubah.');
        }
        const valid = (0, file_util_1.validateFile)(file, konfig.maxBytes, konfig.tipe);
        const folder = berkas?.folderPath ?? this.buatFolder(userId, biodata.namaLengkap);
        const key = `${folder}/${jenis}.${valid.ext}`;
        const keyLama = berkas ? berkas[konfig.field] : null;
        await this.storage.upload(key, valid.buffer, valid.mime);
        const fileData = {};
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
    async ajukan(userId) {
        const [biodata, berkas] = await Promise.all([
            this.prisma.biodataSiswa.findUnique({ where: { userId } }),
            this.prisma.berkasSiswa.findUnique({ where: { userId } }),
        ]);
        if (!biodata) {
            throw new common_1.BadRequestException('Biodata belum tersedia.');
        }
        const statusBerkas = berkas?.statusVerifikasi ?? client_1.StatusVerifikasi.PENDING;
        const adaPerbaikan = biodata.statusFormulir === client_1.StatusVerifikasi.REVISI ||
            statusBerkas === client_1.StatusVerifikasi.REVISI;
        if (biodata.diajukanPada !== null && !adaPerbaikan) {
            throw new common_1.BadRequestException('Pendaftaran sudah diajukan dan sedang diproses.');
        }
        const { biodataKurang, berkasKurang } = (0, kelengkapan_util_1.cekKelengkapan)(biodata, berkas);
        if (biodataKurang.length > 0 || berkasKurang.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Data atau berkas belum lengkap.',
                biodataKurang,
                berkasKurang,
            });
        }
        if (!berkas) {
            throw new common_1.BadRequestException('Data berkas belum tersedia.');
        }
        const gelombangId = biodata.gelombangId ?? (await this.konfigurasi.cariGelombangAktif());
        await this.prisma.$transaction([
            this.prisma.biodataSiswa.update({
                where: { userId },
                data: {
                    diajukanPada: new Date(),
                    gelombangId,
                    statusFormulir: biodata.statusFormulir === client_1.StatusVerifikasi.REVISI
                        ? client_1.StatusVerifikasi.PENDING
                        : biodata.statusFormulir,
                },
            }),
            this.prisma.berkasSiswa.update({
                where: { userId },
                data: {
                    statusVerifikasi: berkas.statusVerifikasi === client_1.StatusVerifikasi.REVISI
                        ? client_1.StatusVerifikasi.PENDING
                        : berkas.statusVerifikasi,
                },
            }),
        ]);
        return {
            status: 'success',
            message: 'Pendaftaran berhasil diajukan dan menunggu verifikasi panitia.',
        };
    }
    async submitPembayaran(userId, dto, bukti) {
        const [biodata, berkas, pembayaran] = await Promise.all([
            this.prisma.biodataSiswa.findUnique({
                where: { userId },
                include: { jurusanDiterima: true },
            }),
            this.prisma.berkasSiswa.findUnique({ where: { userId } }),
            this.prisma.pembayaran.findUnique({ where: { userId } }),
        ]);
        if (!berkas || berkas.statusVerifikasi !== client_1.StatusVerifikasi.VALID) {
            throw new common_1.BadRequestException('Pembayaran terkunci. Berkas belum diverifikasi atau divalidasi oleh panitia.');
        }
        if (!biodata || biodata.statusFormulir !== client_1.StatusVerifikasi.VALID) {
            throw new common_1.BadRequestException('Pembayaran terkunci. Biodata belum divalidasi oleh panitia.');
        }
        if (!biodata.jurusanDiterima) {
            throw new common_1.BadRequestException('Penempatan jurusan belum ditetapkan. Silakan hubungi panitia.');
        }
        if (pembayaran?.status === client_1.StatusVerifikasi.LUNAS) {
            throw new common_1.BadRequestException('Pembayaran sudah lunas.');
        }
        if (dto.metode === client_1.MetodePembayaran.OFFLINE && bukti) {
            throw new common_1.BadRequestException('Pembayaran offline tidak memerlukan bukti pembayaran.');
        }
        if (dto.metode === client_1.MetodePembayaran.ONLINE && !bukti) {
            throw new common_1.BadRequestException('Bukti pembayaran wajib diunggah untuk pembayaran online.');
        }
        let buktiKey = null;
        if (dto.metode === client_1.MetodePembayaran.ONLINE) {
            const valid = (0, file_util_1.validateFile)(bukti, berkas_config_1.BUKTI_PEMBAYARAN.maxBytes, berkas_config_1.BUKTI_PEMBAYARAN.tipe);
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
                status: client_1.StatusVerifikasi.PENDING,
            },
            create: {
                userId,
                metode: dto.metode,
                jumlah,
                buktiUrl: buktiKey,
                status: client_1.StatusVerifikasi.PENDING,
            },
        });
        if (pembayaran?.buktiUrl && pembayaran.buktiUrl !== buktiKey) {
            await this.storage.remove(pembayaran.buktiUrl);
        }
        return {
            status: 'success',
            message: dto.metode === client_1.MetodePembayaran.ONLINE
                ? 'Bukti pembayaran berhasil dikirim dan menunggu konfirmasi panitia.'
                : 'Pembayaran offline dicatat. Silakan membayar langsung di sekolah.',
            data: { metode: hasil.metode, jumlah: hasil.jumlah, status: hasil.status },
        };
    }
};
exports.PendaftaranService = PendaftaranService;
exports.PendaftaranService = PendaftaranService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        konfigurasi_service_1.KonfigurasiService])
], PendaftaranService);
//# sourceMappingURL=pendaftaran.service.js.map