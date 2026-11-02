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
exports.KonfigurasiService = exports.KUNCI_PENGATURAN = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const security_util_1 = require("../auth/utils/security.util");
exports.KUNCI_PENGATURAN = [
    'bankNama',
    'bankNomorRekening',
    'bankAtasNama',
    'instruksiPembayaranOffline',
    'instruksiRegistrasiUlang',
];
function awalHari(value) {
    return value.length === 10 ? new Date(`${value}T00:00:00.000+08:00`) : new Date(value);
}
function akhirHari(value) {
    return value.length === 10 ? new Date(`${value}T23:59:59.999+08:00`) : new Date(value);
}
let KonfigurasiService = class KonfigurasiService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async daftarJurusan(hanyaAktif) {
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
        const peta = new Map(terisi.map((item) => [item.jurusanDiterimaId, item._count._all]));
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
    async buatJurusan(dto) {
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
        }
        catch (error) {
            if ((0, security_util_1.isUniqueViolation)(error)) {
                throw new common_1.ConflictException('Nama jurusan sudah ada.');
            }
            throw error;
        }
    }
    async ubahJurusan(id, dto) {
        const jurusan = await this.prisma.jurusan.findUnique({ where: { id } });
        if (!jurusan) {
            throw new common_1.NotFoundException('Jurusan tidak ditemukan.');
        }
        if (dto.kuota !== undefined) {
            const terisi = await this.prisma.biodataSiswa.count({ where: { jurusanDiterimaId: id } });
            if (dto.kuota < terisi) {
                throw new common_1.BadRequestException(`Kuota tidak boleh lebih kecil dari jumlah siswa yang sudah ditempatkan (${terisi}).`);
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
        }
        catch (error) {
            if ((0, security_util_1.isUniqueViolation)(error)) {
                throw new common_1.ConflictException('Nama jurusan sudah ada.');
            }
            throw error;
        }
    }
    async hapusJurusan(id) {
        const jurusan = await this.prisma.jurusan.findUnique({ where: { id } });
        if (!jurusan) {
            throw new common_1.NotFoundException('Jurusan tidak ditemukan.');
        }
        const dipakai = await this.prisma.biodataSiswa.count({
            where: {
                OR: [{ jurusanId: id }, { jurusanCadanganId: id }, { jurusanDiterimaId: id }],
            },
        });
        if (dipakai > 0) {
            throw new common_1.ConflictException('Jurusan sudah dipilih oleh siswa dan tidak dapat dihapus. Nonaktifkan jurusan ini.');
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
    async buatGelombang(dto) {
        const mulai = awalHari(dto.tanggalMulai);
        const selesai = akhirHari(dto.tanggalSelesai);
        if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime()) || selesai <= mulai) {
            throw new common_1.BadRequestException('Tanggal selesai harus setelah tanggal mulai.');
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
        }
        catch (error) {
            if ((0, security_util_1.isUniqueViolation)(error)) {
                throw new common_1.ConflictException('Nama gelombang sudah ada.');
            }
            throw error;
        }
    }
    async ubahGelombang(id, dto) {
        const gelombang = await this.prisma.gelombangPendaftaran.findUnique({ where: { id } });
        if (!gelombang) {
            throw new common_1.NotFoundException('Gelombang tidak ditemukan.');
        }
        const mulai = dto.tanggalMulai ? awalHari(dto.tanggalMulai) : gelombang.tanggalMulai;
        const selesai = dto.tanggalSelesai ? akhirHari(dto.tanggalSelesai) : gelombang.tanggalSelesai;
        if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime()) || selesai <= mulai) {
            throw new common_1.BadRequestException('Tanggal selesai harus setelah tanggal mulai.');
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
        }
        catch (error) {
            if ((0, security_util_1.isUniqueViolation)(error)) {
                throw new common_1.ConflictException('Nama gelombang sudah ada.');
            }
            throw error;
        }
    }
    async hapusGelombang(id) {
        const gelombang = await this.prisma.gelombangPendaftaran.findUnique({ where: { id } });
        if (!gelombang) {
            throw new common_1.NotFoundException('Gelombang tidak ditemukan.');
        }
        const dipakai = await this.prisma.biodataSiswa.count({ where: { gelombangId: id } });
        if (dipakai > 0) {
            throw new common_1.ConflictException('Gelombang sudah dipakai oleh siswa dan tidak dapat dihapus. Nonaktifkan gelombang ini.');
        }
        await this.prisma.gelombangPendaftaran.delete({ where: { id } });
        return { status: 'success', message: 'Gelombang berhasil dihapus.' };
    }
    async cariGelombangAktif() {
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
            throw new common_1.BadRequestException('Pendaftaran belum dibuka atau sudah ditutup.');
        }
        return gelombang.id;
    }
    async ambilPengaturan() {
        const baris = await this.prisma.pengaturan.findMany({
            where: { kunci: { in: [...exports.KUNCI_PENGATURAN] } },
        });
        const hasil = Object.fromEntries(exports.KUNCI_PENGATURAN.map((kunci) => [kunci, null]));
        for (const item of baris) {
            hasil[item.kunci] = item.nilai;
        }
        return hasil;
    }
    async daftarPengaturan() {
        return { status: 'success', data: await this.ambilPengaturan() };
    }
    async ubahPengaturan(dto) {
        const operasi = exports.KUNCI_PENGATURAN.filter((kunci) => dto[kunci] !== undefined).map((kunci) => this.prisma.pengaturan.upsert({
            where: { kunci },
            update: { nilai: dto[kunci] },
            create: { kunci, nilai: dto[kunci] },
        }));
        if (operasi.length === 0) {
            throw new common_1.BadRequestException('Tidak ada pengaturan yang diubah.');
        }
        await this.prisma.$transaction(operasi);
        return {
            status: 'success',
            message: 'Pengaturan berhasil disimpan.',
            data: await this.ambilPengaturan(),
        };
    }
};
exports.KonfigurasiService = KonfigurasiService;
exports.KonfigurasiService = KonfigurasiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KonfigurasiService);
//# sourceMappingURL=konfigurasi.service.js.map