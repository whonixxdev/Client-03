export const UNGGAH_BERKAS_MAKS = 4 * 1024 * 1024;

export const BUKTI_PEMBAYARAN = {
  maxBytes: 2 * 1024 * 1024,
  tipe: ['jpg', 'png', 'pdf'],
} as const;

export const AVATAR = {
  maxBytes: 3 * 1024 * 1024,
  tipe: ['jpg', 'png'],
} as const;

export const JENIS_BERKAS = {
  kk: {
    field: 'fileKk',
    label: 'Kartu Keluarga (KK)',
    maxBytes: 4 * 1024 * 1024,
    tipe: ['jpg', 'png', 'pdf'],
    wajib: true,
  },
  akta: {
    field: 'fileAkteKelahiran',
    label: 'Akta kelahiran',
    maxBytes: 4 * 1024 * 1024,
    tipe: ['jpg', 'png', 'pdf'],
    wajib: true,
  },
  skl: {
    field: 'fileIjazahSkl',
    label: 'Surat Keterangan Lulus (SKL)',
    maxBytes: 4 * 1024 * 1024,
    tipe: ['jpg', 'png', 'pdf'],
    wajib: true,
  },
  kia: {
    field: 'fileIdentitasAnak',
    label: 'KIA / KTP anak',
    maxBytes: 4 * 1024 * 1024,
    tipe: ['jpg', 'png', 'pdf'],
    wajib: true,
  },
  kip: {
    field: 'fileKip',
    label: 'Kartu Indonesia Pintar (KIP)',
    maxBytes: 4 * 1024 * 1024,
    tipe: ['jpg', 'png', 'pdf'],
    wajib: false,
  },
} as const;

export type JenisBerkas = keyof typeof JENIS_BERKAS;

export type BerkasField = (typeof JENIS_BERKAS)[JenisBerkas]['field'];

export const DAFTAR_JENIS = Object.keys(JENIS_BERKAS) as JenisBerkas[];

export const BERKAS_WAJIB = DAFTAR_JENIS.filter((jenis) => JENIS_BERKAS[jenis].wajib);

export function isJenisBerkas(value: string): value is JenisBerkas {
  return Object.prototype.hasOwnProperty.call(JENIS_BERKAS, value);
}
