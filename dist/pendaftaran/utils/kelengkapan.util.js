"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cekKelengkapan = cekKelengkapan;
const berkas_config_1 = require("./berkas.config");
const LABEL_BIODATA = [
    ['namaLengkap', 'Nama lengkap'],
    ['avatarUrl', 'Foto profil'],
    ['nik', 'NIK'],
    ['nisn', 'NISN'],
    ['jenisKelamin', 'Jenis kelamin'],
    ['tempatLahir', 'Tempat lahir'],
    ['tanggalLahir', 'Tanggal lahir'],
    ['agama', 'Agama'],
    ['alamat', 'Alamat'],
    ['noHpSiswa', 'Nomor HP siswa'],
    ['namaAyah', 'Nama ayah'],
    ['namaIbu', 'Nama ibu'],
    ['asalSmp', 'Asal SMP'],
    ['jurusanId', 'Jurusan utama'],
    ['jurusanCadanganId', 'Jurusan cadangan'],
];
function cekKelengkapan(biodata, berkas) {
    const biodataKurang = [];
    for (const [field, label] of LABEL_BIODATA) {
        const nilai = biodata[field];
        if (nilai === null || nilai === undefined || nilai === '') {
            biodataKurang.push(label);
        }
    }
    if (!biodata.noHpAyah && !biodata.noHpIbu) {
        biodataKurang.push('Nomor HP orang tua');
    }
    const berkasKurang = berkas_config_1.BERKAS_WAJIB.filter((jenis) => !berkas || !berkas[berkas_config_1.JENIS_BERKAS[jenis].field]).map((jenis) => berkas_config_1.JENIS_BERKAS[jenis].label);
    return { biodataKurang, berkasKurang };
}
//# sourceMappingURL=kelengkapan.util.js.map