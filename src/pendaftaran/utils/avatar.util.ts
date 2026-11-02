import { BadRequestException } from '@nestjs/common';
import * as modulSharp from 'sharp';

interface PengolahGambar {
  rotate(): PengolahGambar;
  resize(lebar: number, tinggi: number, opsi: { fit: 'cover' }): PengolahGambar;
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

export async function olahAvatar(buffer: Buffer): Promise<Buffer> {
  const fabrik = ambilFabrik();
  try {
    return await fabrik(buffer, { limitInputPixels: 25000000 })
      .rotate()
      .resize(512, 512, { fit: 'cover' })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    throw new BadRequestException(
      'Foto tidak dapat diproses. Gunakan foto JPG atau PNG yang valid.',
    );
  }
}