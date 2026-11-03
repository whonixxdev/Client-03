import { BadRequestException } from '@nestjs/common';
import * as modulSharp from 'sharp';

interface PengolahGambar {
  rotate(): PengolahGambar;
  resize(lebar: number, tinggi: number, opsi: { fit: 'cover' }): PengolahGambar;
  resize(opsi: { width: number; withoutEnlargement: boolean }): PengolahGambar;
  jpeg(opsi: { quality: number }): PengolahGambar;
  toBuffer(): Promise<Buffer>;
}

type FabrikPengolah = (input: Buffer, opsi: { limitInputPixels: number }) => PengolahGambar;

function ambilFabrik(): FabrikPengolah {
  const modul = modulSharp as unknown as { default?: unknown; sharp?: unknown };
  const kandidat: unknown[] = [modul.default, modul.sharp, modulSharp as unknown];
  const fabrik = kandidat.find((item) => typeof item === 'function');
  if (!fabrik) {
    throw new Error('Pustaka sharp tidak dapat dimuat.');
  }
  return fabrik as FabrikPengolah;
}

async function jalankan(
  buffer: Buffer,
  olah: (pengolah: PengolahGambar) => PengolahGambar,
  pesanGagal: string,
): Promise<Buffer> {
  const fabrik = ambilFabrik();
  try {
    return await olah(fabrik(buffer, { limitInputPixels: 25000000 })).toBuffer();
  } catch {
    throw new BadRequestException(pesanGagal);
  }
}

export function olahAvatar(buffer: Buffer): Promise<Buffer> {
  return jalankan(
    buffer,
    (pengolah) => pengolah.rotate().resize(512, 512, { fit: 'cover' }).jpeg({ quality: 82 }),
    'Foto tidak dapat diproses. Gunakan foto JPG atau PNG yang valid.',
  );
}

export function olahThumbnail(buffer: Buffer): Promise<Buffer> {
  return jalankan(
    buffer,
    (pengolah) => pengolah.rotate().resize(96, 96, { fit: 'cover' }).jpeg({ quality: 70 }),
    'Foto tidak dapat diproses.',
  );
}

export function olahGambarBerita(buffer: Buffer): Promise<Buffer> {
  return jalankan(
    buffer,
    (pengolah) =>
      pengolah.rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80 }),
    'Gambar tidak dapat diproses. Gunakan gambar JPG atau PNG yang valid.',
  );
}
