"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BERKAS_WAJIB = exports.DAFTAR_JENIS = exports.JENIS_BERKAS = exports.AVATAR = exports.BUKTI_PEMBAYARAN = exports.UNGGAH_BERKAS_MAKS = void 0;
exports.isJenisBerkas = isJenisBerkas;
exports.UNGGAH_BERKAS_MAKS = 5 * 1024 * 1024;
exports.BUKTI_PEMBAYARAN = {
    maxBytes: 2 * 1024 * 1024,
    tipe: ['jpg', 'png', 'pdf'],
};
exports.AVATAR = {
    maxBytes: 3 * 1024 * 1024,
    tipe: ['jpg', 'png'],
};
exports.JENIS_BERKAS = {
    kk: {
        field: 'fileKk',
        label: 'Kartu Keluarga (KK)',
        maxBytes: 5 * 1024 * 1024,
        tipe: ['jpg', 'png', 'pdf'],
        wajib: true,
    },
    akta: {
        field: 'fileAkteKelahiran',
        label: 'Akta kelahiran',
        maxBytes: 5 * 1024 * 1024,
        tipe: ['jpg', 'png', 'pdf'],
        wajib: true,
    },
    skl: {
        field: 'fileIjazahSkl',
        label: 'Surat Keterangan Lulus (SKL)',
        maxBytes: 5 * 1024 * 1024,
        tipe: ['jpg', 'png', 'pdf'],
        wajib: true,
    },
    kia: {
        field: 'fileIdentitasAnak',
        label: 'KIA / KTP anak',
        maxBytes: 5 * 1024 * 1024,
        tipe: ['jpg', 'png', 'pdf'],
        wajib: true,
    },
    kip: {
        field: 'fileKip',
        label: 'Kartu Indonesia Pintar (KIP)',
        maxBytes: 5 * 1024 * 1024,
        tipe: ['jpg', 'png', 'pdf'],
        wajib: false,
    },
};
exports.DAFTAR_JENIS = Object.keys(exports.JENIS_BERKAS);
exports.BERKAS_WAJIB = exports.DAFTAR_JENIS.filter((jenis) => exports.JENIS_BERKAS[jenis].wajib);
function isJenisBerkas(value) {
    return Object.prototype.hasOwnProperty.call(exports.JENIS_BERKAS, value);
}
//# sourceMappingURL=berkas.config.js.map