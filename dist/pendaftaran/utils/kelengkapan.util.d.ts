import type { BerkasSiswa, BiodataSiswa } from '@prisma/client';
export interface Kelengkapan {
    biodataKurang: string[];
    berkasKurang: string[];
}
export declare function cekKelengkapan(biodata: BiodataSiswa, berkas: BerkasSiswa | null): Kelengkapan;
