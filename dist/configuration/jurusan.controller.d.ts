import { KonfigurasiService } from './konfigurasi.service';
export declare class JurusanController {
    private readonly konfigurasiService;
    constructor(konfigurasiService: KonfigurasiService);
    daftarJurusan(): Promise<{
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
}
