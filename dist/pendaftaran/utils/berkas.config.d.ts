export declare const UNGGAH_BERKAS_MAKS: number;
export declare const BUKTI_PEMBAYARAN: {
    readonly maxBytes: number;
    readonly tipe: readonly ["jpg", "png", "pdf"];
};
export declare const AVATAR: {
    readonly maxBytes: number;
    readonly tipe: readonly ["jpg", "png"];
};
export declare const JENIS_BERKAS: {
    readonly kk: {
        readonly field: "fileKk";
        readonly label: "Kartu Keluarga (KK)";
        readonly maxBytes: number;
        readonly tipe: readonly ["jpg", "png", "pdf"];
        readonly wajib: true;
    };
    readonly akta: {
        readonly field: "fileAkteKelahiran";
        readonly label: "Akta kelahiran";
        readonly maxBytes: number;
        readonly tipe: readonly ["jpg", "png", "pdf"];
        readonly wajib: true;
    };
    readonly skl: {
        readonly field: "fileIjazahSkl";
        readonly label: "Surat Keterangan Lulus (SKL)";
        readonly maxBytes: number;
        readonly tipe: readonly ["jpg", "png", "pdf"];
        readonly wajib: true;
    };
    readonly kia: {
        readonly field: "fileIdentitasAnak";
        readonly label: "KIA / KTP anak";
        readonly maxBytes: number;
        readonly tipe: readonly ["jpg", "png", "pdf"];
        readonly wajib: true;
    };
    readonly kip: {
        readonly field: "fileKip";
        readonly label: "Kartu Indonesia Pintar (KIP)";
        readonly maxBytes: number;
        readonly tipe: readonly ["jpg", "png", "pdf"];
        readonly wajib: false;
    };
};
export type JenisBerkas = keyof typeof JENIS_BERKAS;
export type BerkasField = (typeof JENIS_BERKAS)[JenisBerkas]['field'];
export declare const DAFTAR_JENIS: JenisBerkas[];
export declare const BERKAS_WAJIB: ("kk" | "akta" | "skl" | "kia" | "kip")[];
export declare function isJenisBerkas(value: string): value is JenisBerkas;
