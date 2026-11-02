import { StatusRegistrasiUlang, StatusVerifikasi } from '@prisma/client';
export declare class QueryPanitiaDto {
    page?: number;
    limit?: number;
    search?: string;
    jurusanId?: string;
    gelombangId?: string;
    statusFormulir?: StatusVerifikasi;
    statusBerkas?: StatusVerifikasi;
    statusPembayaran?: StatusVerifikasi;
    statusDaftarUlang?: StatusRegistrasiUlang;
    diajukan?: boolean;
}
