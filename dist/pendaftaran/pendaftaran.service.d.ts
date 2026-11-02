import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { KonfigurasiService } from '../configuration/konfigurasi.service';
import { CreateBiodataDto } from './dto/biodata.dto';
import { CreatePembayaranDto } from './dto/pembayaran.dto';
export declare class PendaftaranService {
    private prisma;
    private storage;
    private konfigurasi;
    constructor(prisma: PrismaService, storage: StorageService, konfigurasi: KonfigurasiService);
    private bisaEdit;
    private buatFolder;
    private parseTanggalLahir;
    private bangunDaftarFile;
    getMyPendaftaran(userId: string): Promise<{
        status: string;
        data: {
            biodata: {
                avatarUrl: string;
                jurusan: {
                    id: string;
                    namaJurusan: string;
                    biayaPendaftaran: number;
                };
                jurusanCadangan: {
                    id: string;
                    namaJurusan: string;
                    biayaPendaftaran: number;
                };
                jurusanDiterima: {
                    id: string;
                    namaJurusan: string;
                    biayaPendaftaran: number;
                };
                gelombang: {
                    id: string;
                    nama: string;
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
            biayaPendaftaran: number;
            kekurangan: import("./utils/kelengkapan.util").Kelengkapan;
            akses: {
                biodataBisaDiedit: boolean;
                berkasBisaDiedit: boolean;
                bisaMengajukan: boolean;
                pembayaranTerbuka: boolean;
                daftarUlangTerbuka: boolean;
            };
            infoPembayaran: {
                bankNama: string;
                nomorRekening: string;
                atasNama: string;
                instruksiOffline: string;
            };
            instruksiRegistrasiUlang: string;
            catatanPanitia: {
                createdAt: Date;
                pesan: string;
                kategori: string;
            }[];
        };
    }>;
    upsertBiodata(userId: string, dto: CreateBiodataDto): Promise<{
        status: string;
        message: string;
        data: {
            namaLengkap: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            avatarUrl: string | null;
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
    }>;
    uploadAvatar(userId: string, file: Express.Multer.File | undefined): Promise<{
        status: string;
        message: string;
        data: {
            url: string;
        };
    }>;
    uploadBerkas(userId: string, jenis: string, file: Express.Multer.File | undefined): Promise<{
        status: string;
        message: string;
        data: {
            jenis: "kk" | "akta" | "skl" | "kia" | "kip";
            url: string;
        };
    }>;
    ajukan(userId: string): Promise<{
        status: string;
        message: string;
    }>;
    submitPembayaran(userId: string, dto: CreatePembayaranDto, bukti: Express.Multer.File | undefined): Promise<{
        status: string;
        message: string;
        data: {
            metode: import(".prisma/client").$Enums.MetodePembayaran;
            jumlah: number;
            status: import(".prisma/client").$Enums.StatusVerifikasi;
        };
    }>;
}
