import type { BerkasSiswa, BiodataSiswa } from '@prisma/client';
import { BERKAS_WAJIB, JENIS_BERKAS } from './berkas.config';

const LABEL_BIODATA: ReadonlyArray<readonly [keyof BiodataSiswa, string]> = [
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

export interface Kelengkapan {
  biodataKurang: string[];
  berkasKurang: string[];
}

export function cekKelengkapan(biodata: BiodataSiswa, berkas: BerkasSiswa | null): Kelengkapan {
  const biodataKurang: string[] = [];

  for (const [field, label] of LABEL_BIODATA) {
    const nilai = biodata[field];
    if (nilai === null || nilai === undefined || nilai === '') {
      biodataKurang.push(label);
    }
  }

  if (!biodata.noHpAyah && !biodata.noHpIbu) {
    biodataKurang.push('Nomor HP orang tua');
  }

  const berkasKurang = BERKAS_WAJIB.filter((jenis) => !berkas || !berkas[JENIS_BERKAS[jenis].field]).map(
    (jenis) => JENIS_BERKAS[jenis].label,
  );

  return { biodataKurang, berkasKurang };
}
