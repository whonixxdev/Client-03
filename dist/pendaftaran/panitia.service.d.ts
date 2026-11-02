import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { DaftarUlangDto } from './dto/daftar-ulang.dto';
import { KonfirmasiPembayaranDto } from './dto/konfirmasi-pembayaran.dto';
import { QueryPanitiaDto } from './dto/query-panitia.dto';
import { VerifikasiDto } from './dto/verifikasi.dto';
export interface AktorPanitia {
    id: string;
    role: Role;
}
export declare class PanitiaService {
    private prisma;
    private storage;
    private readonly logger;
    constructor(prisma: PrismaService, storage: StorageService);
    private buatFilter;
    private ambilData;
    private catat;
    private urlAvatar;
    private tentukanPenempatan;
    private ringkasStatus;
    getAll(query: QueryPanitiaDto): Promise<{
        status: string;
        data: {
            biodata: {
                avatarUrl: string;
                jurusan: {
                    id: string;
                    namaJurusan: string;
                };
                namaLengkap: string;
                nisn: string;
                noHpSiswa: string;
                asalSmp: string;
                statusFormulir: import(".prisma/client").$Enums.StatusVerifikasi;
                diajukanPada: Date;
                statusDaftarUlang: import(".prisma/client").$Enums.StatusRegistrasiUlang;
                jurusanCadangan: {
                    id: string;
                    namaJurusan: string;
                };
                jurusanDiterima: {
                    id: string;
                    namaJurusan: string;
                };
                gelombang: {
                    id: string;
                    nama: string;
                };
            };
            pembayaran: {
                metode: import(".prisma/client").$Enums.MetodePembayaran;
                jumlah: number;
                status: import(".prisma/client").$Enums.StatusVerifikasi;
            };
            email: string;
            username: string;
            id: string;
            createdAt: Date;
            berkas: {
                statusVerifikasi: import(".prisma/client").$Enums.StatusVerifikasi;
            };
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getDetail(userId: string): Promise<{
        status: string;
        data: {
            id: string;
            email: string;
            username: string;
            createdAt: Date;
            biodata: {
                avatarUrl: string;
                jurusan: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    namaJurusan: string;
                    kuota: number;
                    biayaPendaftaran: number;
                    aktif: boolean;
                };
                jurusanCadangan: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    namaJurusan: string;
                    kuota: number;
                    biayaPendaftaran: number;
                    aktif: boolean;
                };
                jurusanDiterima: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    namaJurusan: string;
                    kuota: number;
                    biayaPendaftaran: number;
                    aktif: boolean;
                };
                gelombang: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    aktif: boolean;
                    nama: string;
                    tanggalMulai: Date;
                    tanggalSelesai: Date;
                };
                namaLengkap: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                nik: string | null;
                nisn: string | null;
                nis: string | null;
                jenisKelamin: string | null;
                tempatLahir: string | null;
                tanggalLahir: Date | null;
                agama: string | null;
                alamat: string | null;
                noHpSiswa: string | null;
                namaAyah: string | null;
                noHpAyah: string | null;
                namaIbu: string | null;
                noHpIbu: string | null;
                asalSmp: string | null;
                statusFormulir: import(".prisma/client").$Enums.StatusVerifikasi;
                diajukanPada: Date | null;
                statusDaftarUlang: import(".prisma/client").$Enums.StatusRegistrasiUlang;
                catatanDaftarUlang: string | null;
                jurusanId: string | null;
                jurusanCadanganId: string | null;
                jurusanDiterimaId: string | null;
                gelombangId: string | null;
                userId: string;
            };
            berkas: {
                statusVerifikasi: import(".prisma/client").$Enums.StatusVerifikasi;
                catatanAdmin: string;
                files: {
                    [k: string]: {
                        readonly label: "Kartu Keluarga (KK)" | "Akta kelahiran" | "Surat Keterangan Lulus (SKL)" | "KIA / KTP anak" | "Kartu Indonesia Pintar (KIP)";
                        readonly wajib: boolean;
                        readonly tersedia: boolean;
                        readonly url: string;
                    };
                };
            };
            pembayaran: {
                metode: import(".prisma/client").$Enums.MetodePembayaran;
                jumlah: number;
                status: import(".prisma/client").$Enums.StatusVerifikasi;
                buktiUrl: string;
            };
            kekurangan: import("./utils/kelengkapan.util").Kelengkapan;
            riwayat: {
                panitiaId: string;
                id: string;
                createdAt: Date;
                userId: string;
                pesan: string;
                kategori: string;
            }[];
        };
    }>;
    verifikasi(aktor: AktorPanitia, userId: string, dto: VerifikasiDto): Promise<{
        status: string;
        message: string;
    }>;
    konfirmasiPembayaran(aktor: AktorPanitia, userId: string, dto: KonfirmasiPembayaranDto): Promise<{
        status: string;
        message: string;
        data: {
            metode: import(".prisma/client").$Enums.MetodePembayaran;
            jumlah: number;
            status: import(".prisma/client").$Enums.StatusVerifikasi;
        };
    }>;
    daftarUlang(aktor: AktorPanitia, userId: string, dto: DaftarUlangDto): Promise<{
        status: string;
        message: string;
        data: {
            statusDaftarUlang: import(".prisma/client").$Enums.StatusRegistrasiUlang;
            catatanDaftarUlang: string;
        };
    }>;
    exportExcel(aktor: AktorPanitia, query: QueryPanitiaDto): Promise<Buffer>;
}
