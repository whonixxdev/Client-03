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
var PanitiaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanitiaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const exceljs_1 = require("exceljs");
const prisma_service_1 = require("../prisma/prisma.service");
const storage_service_1 = require("../storage/storage.service");
const berkas_config_1 = require("./utils/berkas.config");
const kelengkapan_util_1 = require("./utils/kelengkapan.util");
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
};
const PILIHAN_EKSPOR = {
    email: true,
    username: true,
    createdAt: true,
    biodata: { include: { jurusan: { select: { namaJurusan: true } } } },
    berkas: { select: { statusVerifikasi: true } },
    pembayaran: { select: { metode: true, jumlah: true, status: true } },
};
const LABEL_DAFTAR_ULANG = {
    BELUM_HADIR: 'belum hadir',
    HADIR_VERIFIKASI: 'hadir dan sedang diverifikasi',
    SUDAH_LENGKAP: 'sudah lengkap',
    ADA_KEKURANGAN: 'ada kekurangan berkas',
};
let PanitiaService = PanitiaService_1 = class PanitiaService {
    prisma;
    storage;
    logger = new common_1.Logger(PanitiaService_1.name);
    constructor(prisma, storage) {
        this.prisma = prisma;
        this.storage = storage;
    }
    buatFilter(query) {
        const and = [];
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
        const filterBiodata = {};
        if (query.gelombangId)
            filterBiodata.gelombangId = query.gelombangId;
        if (query.statusFormulir)
            filterBiodata.statusFormulir = query.statusFormulir;
        if (query.statusDaftarUlang)
            filterBiodata.statusDaftarUlang = query.statusDaftarUlang;
        if (query.diajukan === true)
            filterBiodata.diajukanPada = { not: null };
        if (Object.keys(filterBiodata).length > 0) {
            and.push({ biodata: { is: filterBiodata } });
        }
        if (query.statusBerkas) {
            and.push({ berkas: { is: { statusVerifikasi: query.statusBerkas } } });
        }
        if (query.statusPembayaran) {
            and.push({ pembayaran: { is: { status: query.statusPembayaran } } });
        }
        return { role: client_1.Role.SISWA, isVerified: true, AND: and };
    }
    async ambilData(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, role: client_1.Role.SISWA },
            select: { biodata: true, berkas: true, pembayaran: true },
        });
        if (!user || !user.biodata) {
            throw new common_1.NotFoundException('Data pendaftaran siswa tidak ditemukan.');
        }
        return { biodata: user.biodata, berkas: user.berkas, pembayaran: user.pembayaran };
    }
    catat(db, userId, aktor, kategori, pesan) {
        return db.komentarPanitia.create({
            data: { userId, panitiaId: aktor.id, kategori, pesan },
        });
    }
    async urlAvatar(key) {
        return key ? this.storage.createSignedUrl(key, 300, 'avatar') : null;
    }
    async tentukanPenempatan(tx, biodata) {
        if (!biodata.jurusanId) {
            throw new common_1.BadRequestException('Siswa belum memilih jurusan utama.');
        }
        const idPilihan = [biodata.jurusanId, biodata.jurusanCadanganId].filter((id) => Boolean(id));
        const idTerurut = [...new Set(idPilihan)].sort();
        for (const id of idTerurut) {
            await tx.$queryRaw `SELECT id FROM jurusans WHERE id = ${id} FOR UPDATE`;
        }
        const daftarJurusan = await tx.jurusan.findMany({ where: { id: { in: idPilihan } } });
        const utama = daftarJurusan.find((item) => item.id === biodata.jurusanId);
        const cadangan = biodata.jurusanCadanganId
            ? daftarJurusan.find((item) => item.id === biodata.jurusanCadanganId)
            : undefined;
        if (!utama) {
            throw new common_1.BadRequestException('Jurusan utama siswa tidak ditemukan.');
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
        throw new common_1.ConflictException(`Kuota jurusan ${namaJurusan} sudah penuh. Minta siswa mengganti pilihan jurusan (status REVISI).`);
    }
    ringkasStatus(bagian, valid, catatan) {
        const dasar = valid ? `${bagian} dinyatakan valid.` : `${bagian} perlu direvisi.`;
        const tambahan = catatan?.trim() ? ` Catatan: ${catatan.trim()}` : '';
        return dasar + tambahan;
    }
    async getAll(query) {
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
        const data = await Promise.all(baris.map(async (siswa) => ({
            ...siswa,
            biodata: siswa.biodata
                ? { ...siswa.biodata, avatarUrl: await this.urlAvatar(siswa.biodata.avatarUrl) }
                : null,
        })));
        return {
            status: 'success',
            data,
            meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
        };
    }
    async getDetail(userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, role: client_1.Role.SISWA },
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
            throw new common_1.NotFoundException('Data siswa tidak ditemukan.');
        }
        const files = await Promise.all(berkas_config_1.DAFTAR_JENIS.map(async (jenis) => {
            const konfig = berkas_config_1.JENIS_BERKAS[jenis];
            const key = user.berkas ? user.berkas[konfig.field] : null;
            const url = key ? await this.storage.createSignedUrl(key) : null;
            return [
                jenis,
                { label: konfig.label, wajib: konfig.wajib, tersedia: Boolean(key), url },
            ];
        }));
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
                kekurangan: user.biodata ? (0, kelengkapan_util_1.cekKelengkapan)(user.biodata, user.berkas) : null,
                riwayat: user.komentars,
            },
        };
    }
    async verifikasi(aktor, userId, dto) {
        if (!dto.statusFormulir && !dto.statusBerkas) {
            throw new common_1.BadRequestException('Isi minimal salah satu status verifikasi.');
        }
        const { biodata, berkas, pembayaran } = await this.ambilData(userId);
        if (biodata.diajukanPada === null) {
            throw new common_1.BadRequestException('Siswa belum mengajukan pendaftaran.');
        }
        if (pembayaran?.status === client_1.StatusVerifikasi.LUNAS) {
            throw new common_1.BadRequestException('Pembayaran sudah lunas, status verifikasi tidak dapat diubah.');
        }
        if (dto.statusBerkas && !berkas) {
            throw new common_1.BadRequestException('Siswa belum memiliki data berkas.');
        }
        const { biodataKurang, berkasKurang } = (0, kelengkapan_util_1.cekKelengkapan)(biodata, berkas);
        if (dto.statusFormulir === client_1.StatusVerifikasi.VALID && biodataKurang.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Biodata belum lengkap, tidak dapat dinyatakan valid.',
                biodataKurang,
            });
        }
        if (dto.statusBerkas === client_1.StatusVerifikasi.VALID && berkasKurang.length > 0) {
            throw new common_1.BadRequestException({
                message: 'Berkas belum lengkap, tidak dapat dinyatakan valid.',
                berkasKurang,
            });
        }
        if (dto.statusFormulir === client_1.StatusVerifikasi.REVISI && !dto.catatanFormulir?.trim()) {
            throw new common_1.BadRequestException('Catatan revisi formulir wajib diisi.');
        }
        if (dto.statusBerkas === client_1.StatusVerifikasi.REVISI && !dto.catatanAdmin?.trim()) {
            throw new common_1.BadRequestException('Catatan revisi berkas wajib diisi.');
        }
        const statusFormulirAkhir = dto.statusFormulir ?? biodata.statusFormulir;
        const statusBerkasAkhir = dto.statusBerkas ?? berkas?.statusVerifikasi ?? client_1.StatusVerifikasi.PENDING;
        const keduanyaValid = statusFormulirAkhir === client_1.StatusVerifikasi.VALID && statusBerkasAkhir === client_1.StatusVerifikasi.VALID;
        const adaRevisi = dto.statusFormulir === client_1.StatusVerifikasi.REVISI || dto.statusBerkas === client_1.StatusVerifikasi.REVISI;
        await this.prisma.$transaction(async (tx) => {
            if (dto.statusFormulir) {
                await tx.biodataSiswa.update({
                    where: { userId },
                    data: { statusFormulir: dto.statusFormulir },
                });
                await this.catat(tx, userId, aktor, 'FORMULIR', this.ringkasStatus('Formulir', dto.statusFormulir === client_1.StatusVerifikasi.VALID, dto.catatanFormulir));
            }
            if (dto.statusBerkas) {
                await tx.berkasSiswa.update({
                    where: { userId },
                    data: {
                        statusVerifikasi: dto.statusBerkas,
                        catatanAdmin: dto.statusBerkas === client_1.StatusVerifikasi.REVISI ? dto.catatanAdmin?.trim() || null : null,
                    },
                });
                await this.catat(tx, userId, aktor, 'BERKAS', this.ringkasStatus('Berkas', dto.statusBerkas === client_1.StatusVerifikasi.VALID, dto.catatanAdmin));
            }
            if (adaRevisi && biodata.jurusanDiterimaId) {
                await tx.biodataSiswa.update({ where: { userId }, data: { jurusanDiterimaId: null } });
                await this.catat(tx, userId, aktor, 'FORMULIR', 'Penempatan jurusan dilepas karena data perlu direvisi.');
            }
            if (keduanyaValid && !biodata.jurusanDiterimaId) {
                const penempatan = await this.tentukanPenempatan(tx, biodata);
                await tx.biodataSiswa.update({
                    where: { userId },
                    data: { jurusanDiterimaId: penempatan.jurusan.id },
                });
                await this.catat(tx, userId, aktor, 'FORMULIR', penempatan.pakaiCadangan
                    ? `Jurusan utama penuh. Siswa ditempatkan di jurusan cadangan ${penempatan.jurusan.namaJurusan}.`
                    : `Siswa ditempatkan di jurusan ${penempatan.jurusan.namaJurusan}.`);
            }
        });
        return { status: 'success', message: 'Verifikasi berhasil disimpan.' };
    }
    async konfirmasiPembayaran(aktor, userId, dto) {
        const { biodata, pembayaran } = await this.ambilData(userId);
        if (!pembayaran) {
            throw new common_1.NotFoundException('Siswa belum melakukan pembayaran.');
        }
        if (pembayaran.status === client_1.StatusVerifikasi.LUNAS && aktor.role !== client_1.Role.ADMIN) {
            throw new common_1.BadRequestException('Pembayaran sudah lunas. Hubungi admin untuk mengubah status.');
        }
        if (dto.status === 'REVISI' && !dto.catatan?.trim()) {
            throw new common_1.BadRequestException('Catatan wajib diisi saat pembayaran perlu diperbaiki.');
        }
        if (dto.status === 'REVISI' &&
            biodata.statusDaftarUlang !== client_1.StatusRegistrasiUlang.BELUM_HADIR) {
            throw new common_1.BadRequestException('Siswa sudah memulai registrasi ulang, status pembayaran tidak dapat diubah.');
        }
        if (dto.status === 'LUNAS') {
            if (pembayaran.metode === client_1.MetodePembayaran.ONLINE && !pembayaran.buktiUrl) {
                throw new common_1.BadRequestException('Bukti pembayaran belum tersedia.');
            }
        }
        const pesan = dto.status === 'LUNAS'
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
    async daftarUlang(aktor, userId, dto) {
        const { pembayaran } = await this.ambilData(userId);
        if (pembayaran?.status !== client_1.StatusVerifikasi.LUNAS) {
            throw new common_1.BadRequestException('Registrasi ulang belum dapat diproses karena pembayaran belum lunas.');
        }
        if (dto.statusDaftarUlang === client_1.StatusRegistrasiUlang.ADA_KEKURANGAN &&
            !dto.catatanDaftarUlang?.trim()) {
            throw new common_1.BadRequestException('Catatan kekurangan berkas wajib diisi.');
        }
        const catatan = dto.catatanDaftarUlang?.trim() || null;
        const pesan = `Registrasi ulang: ${LABEL_DAFTAR_ULANG[dto.statusDaftarUlang]}.${catatan ? ` Catatan: ${catatan}` : ''}`;
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
    async exportExcel(aktor, query) {
        const where = this.buatFilter(query);
        const data = await this.prisma.user.findMany({
            where,
            select: PILIHAN_EKSPOR,
            orderBy: { createdAt: 'asc' },
            take: 10000,
        });
        this.logger.log(`Ekspor data pendaftar oleh ${aktor.id}: ${data.length} baris`);
        const workbook = new exceljs_1.Workbook();
        const sheet = workbook.addWorksheet('Data Pendaftar');
        sheet.columns = [
            { header: 'No', key: 'no', width: 6 },
            { header: 'Nama Lengkap', key: 'nama', width: 30 },
            { header: 'NIK', key: 'nik', width: 20 },
            { header: 'NISN', key: 'nisn', width: 14 },
            { header: 'Jenis Kelamin', key: 'jk', width: 14 },
            { header: 'Tempat Lahir', key: 'tempatLahir', width: 20 },
            { header: 'Tanggal Lahir', key: 'tanggalLahir', width: 14 },
            { header: 'Agama', key: 'agama', width: 12 },
            { header: 'Alamat', key: 'alamat', width: 40 },
            { header: 'No HP Siswa', key: 'hpSiswa', width: 16 },
            { header: 'Nama Ayah', key: 'namaAyah', width: 24 },
            { header: 'No HP Ayah', key: 'hpAyah', width: 16 },
            { header: 'Nama Ibu', key: 'namaIbu', width: 24 },
            { header: 'No HP Ibu', key: 'hpIbu', width: 16 },
            { header: 'Asal SMP', key: 'asalSmp', width: 28 },
            { header: 'Jurusan', key: 'jurusan', width: 24 },
            { header: 'Status Formulir', key: 'statusFormulir', width: 16 },
            { header: 'Status Berkas', key: 'statusBerkas', width: 16 },
            { header: 'Metode Bayar', key: 'metode', width: 14 },
            { header: 'Jumlah Bayar', key: 'jumlah', width: 14 },
            { header: 'Status Pembayaran', key: 'statusBayar', width: 18 },
            { header: 'Status Registrasi Ulang', key: 'statusDaftarUlang', width: 24 },
            { header: 'Catatan Registrasi Ulang', key: 'catatanDaftarUlang', width: 36 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Tanggal Daftar', key: 'tanggalDaftar', width: 16 },
        ];
        data.forEach((siswa, indeks) => {
            const biodata = siswa.biodata;
            sheet.addRow({
                no: indeks + 1,
                nama: biodata?.namaLengkap ?? '',
                nik: biodata?.nik ?? '',
                nisn: biodata?.nisn ?? '',
                jk: biodata?.jenisKelamin ?? '',
                tempatLahir: biodata?.tempatLahir ?? '',
                tanggalLahir: biodata?.tanggalLahir ? biodata.tanggalLahir.toISOString().slice(0, 10) : '',
                agama: biodata?.agama ?? '',
                alamat: biodata?.alamat ?? '',
                hpSiswa: biodata?.noHpSiswa ?? '',
                namaAyah: biodata?.namaAyah ?? '',
                hpAyah: biodata?.noHpAyah ?? '',
                namaIbu: biodata?.namaIbu ?? '',
                hpIbu: biodata?.noHpIbu ?? '',
                asalSmp: biodata?.asalSmp ?? '',
                jurusan: biodata?.jurusan?.namaJurusan ?? '',
                statusFormulir: biodata?.statusFormulir ?? '',
                statusBerkas: siswa.berkas?.statusVerifikasi ?? '',
                metode: siswa.pembayaran?.metode ?? '',
                jumlah: siswa.pembayaran?.jumlah ?? '',
                statusBayar: siswa.pembayaran?.status ?? '',
                statusDaftarUlang: biodata?.statusDaftarUlang ?? '',
                catatanDaftarUlang: biodata?.catatanDaftarUlang ?? '',
                email: siswa.email,
                username: siswa.username ?? '',
                tanggalDaftar: siswa.createdAt.toISOString().slice(0, 10),
            });
        });
        sheet.getRow(1).font = { bold: true };
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
        sheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: sheet.columns.length },
        };
        const hasil = await workbook.xlsx.writeBuffer();
        return Buffer.from(hasil);
    }
};
exports.PanitiaService = PanitiaService;
exports.PanitiaService = PanitiaService = PanitiaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService])
], PanitiaService);
//# sourceMappingURL=panitia.service.js.map