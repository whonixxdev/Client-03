import { PrismaService } from '../prisma/prisma.service';
import { CreateJurusanDto, UpdateJurusanDto } from './dto/jurusan.dto';
import { CreateGelombangDto, UpdateGelombangDto } from './dto/gelombang.dto';
import { PengaturanDto } from './dto/pengaturan.dto';
export declare const KUNCI_PENGATURAN: readonly ["bankNama", "bankNomorRekening", "bankAtasNama", "instruksiPembayaranOffline", "instruksiRegistrasiUlang"];
export type KunciPengaturan = (typeof KUNCI_PENGATURAN)[number];
export type NilaiPengaturan = Record<KunciPengaturan, string | null>;
export declare class KonfigurasiService {
    private prisma;
    constructor(prisma: PrismaService);
    daftarJurusan(hanyaAktif: boolean): Promise<{
        status: string;
        data: {
            id: string;
            namaJurusan: string;
            kuota: number;
            biayaPendaftaran: number;
            aktif: boolean;
            terisi: number;
            sisaKuota: number;
        }[];
    }>;
    buatJurusan(dto: CreateJurusanDto): Promise<{
        status: string;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            namaJurusan: string;
            kuota: number;
            biayaPendaftaran: number;
            aktif: boolean;
        };
    }>;
    ubahJurusan(id: string, dto: UpdateJurusanDto): Promise<{
        status: string;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            namaJurusan: string;
            kuota: number;
            biayaPendaftaran: number;
            aktif: boolean;
        };
    }>;
    hapusJurusan(id: string): Promise<{
        status: string;
        message: string;
    }>;
    daftarGelombang(): Promise<{
        status: string;
        data: {
            jumlahSiswa: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            aktif: boolean;
            nama: string;
            tanggalMulai: Date;
            tanggalSelesai: Date;
        }[];
    }>;
    buatGelombang(dto: CreateGelombangDto): Promise<{
        status: string;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            aktif: boolean;
            nama: string;
            tanggalMulai: Date;
            tanggalSelesai: Date;
        };
    }>;
    ubahGelombang(id: string, dto: UpdateGelombangDto): Promise<{
        status: string;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            aktif: boolean;
            nama: string;
            tanggalMulai: Date;
            tanggalSelesai: Date;
        };
    }>;
    hapusGelombang(id: string): Promise<{
        status: string;
        message: string;
    }>;
    cariGelombangAktif(): Promise<string | null>;
    ambilPengaturan(): Promise<NilaiPengaturan>;
    daftarPengaturan(): Promise<{
        status: string;
        data: NilaiPengaturan;
    }>;
    ubahPengaturan(dto: PengaturanDto): Promise<{
        status: string;
        message: string;
        data: NilaiPengaturan;
    }>;
}
