import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { isUniqueViolation } from '../auth/utils/security.util';
import { olahGambarBerita } from '../pendaftaran/utils/avatar.util';
import { validateFile } from '../pendaftaran/utils/file.util';
import {
  CreateBeritaDto,
  CreateKategoriDto,
  QueryBeritaDto,
  UpdateBeritaDto,
  UpdateKategoriDto,
} from './dto/berita.dto';
import { ambilTeks, bersihkanHtml, buatRingkasan, buatSlug } from './utils/html.util';

export interface PenggunaBerita {
  id: string;
  role: Role;
}

const GAMBAR_BERITA = { maxBytes: 4 * 1024 * 1024, tipe: ['jpg', 'png'] } as const;

const PILIHAN_DAFTAR = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  thumbnail: true,
  published: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, username: true, namaLengkap: true } },
} satisfies Prisma.ArticleSelect;

@Injectable()
export class BeritaService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  private urlGambar(key: string | null): string | null {
    return key ? this.storage.publicUrl(key, 'berita') : null;
  }

  private bentukItem<
    T extends {
      thumbnail: string | null;
      author: { id: string; username: string | null; namaLengkap: string | null };
    },
  >(item: T) {
    const { author, thumbnail, ...sisa } = item;
    return {
      ...sisa,
      thumbnailUrl: this.urlGambar(thumbnail),
      penulis: author.namaLengkap ?? author.username ?? 'Panitia',
      penulisId: author.id,
    };
  }

  private async buatSlugUnik(judul: string): Promise<string> {
    const dasar = buatSlug(judul);
    for (let percobaan = 0; percobaan < 6; percobaan++) {
      const kandidat =
        percobaan === 0 ? dasar : `${dasar}-${randomBytes(2).toString('hex')}`;
      const ada = await this.prisma.article.findUnique({
        where: { slug: kandidat },
        select: { id: true },
      });
      if (!ada) {
        return kandidat;
      }
    }
    return `${dasar}-${randomBytes(4).toString('hex')}`;
  }

  private async assertKategori(categoryId: string): Promise<void> {
    const kategori = await this.prisma.articleCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!kategori) {
      throw new BadRequestException('Kategori tidak ditemukan.');
    }
  }

  private async ambilMilik(id: string, pengguna: PenggunaBerita) {
    const berita = await this.prisma.article.findUnique({ where: { id } });
    if (!berita) {
      throw new NotFoundException('Berita tidak ditemukan.');
    }
    if (pengguna.role !== Role.ADMIN && berita.authorId !== pengguna.id) {
      throw new ForbiddenException('Anda hanya dapat mengubah berita milik sendiri.');
    }
    return berita;
  }

  async daftarPublik(query: QueryBeritaDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.ArticleWhereInput = { published: true };
    if (query.kategori) {
      where.category = { slug: query.kategori };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { excerpt: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        select: PILIHAN_DAFTAR,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      status: 'success',
      data: data.map((item) => this.bentukItem(item)),
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async detailPublik(slug: string) {
    const berita = await this.prisma.article.findFirst({
      where: { slug, published: true },
      select: { ...PILIHAN_DAFTAR, content: true },
    });

    if (!berita) {
      throw new NotFoundException('Berita tidak ditemukan.');
    }

    return { status: 'success', data: this.bentukItem(berita) };
  }

  async kategoriPublik() {
    const data = await this.prisma.articleCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { articles: { where: { published: true } } } },
      },
    });

    return {
      status: 'success',
      data: data.map(({ _count, ...item }) => ({ ...item, jumlahBerita: _count.articles })),
    };
  }

  async daftarKelola(pengguna: PenggunaBerita, query: QueryBeritaDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ArticleWhereInput = {};
    if (pengguna.role !== Role.ADMIN) {
      where.authorId = pengguna.id;
    }
    if (query.status === 'terbit') where.published = true;
    if (query.status === 'draft') where.published = false;
    if (query.kategori) {
      where.category = { slug: query.kategori };
    }
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        select: PILIHAN_DAFTAR,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      status: 'success',
      data: data.map((item) => this.bentukItem(item)),
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async detailKelola(pengguna: PenggunaBerita, id: string) {
    await this.ambilMilik(id, pengguna);

    const berita = await this.prisma.article.findUnique({
      where: { id },
      select: { ...PILIHAN_DAFTAR, content: true },
    });

    if (!berita) {
      throw new NotFoundException('Berita tidak ditemukan.');
    }

    return { status: 'success', data: this.bentukItem(berita) };
  }

  async buat(pengguna: PenggunaBerita, dto: CreateBeritaDto) {
    await this.assertKategori(dto.categoryId);

    const isi = bersihkanHtml(dto.content);
    const teks = ambilTeks(isi);
    if (!teks && !isi.includes('<img')) {
      throw new BadRequestException('Isi berita tidak boleh kosong.');
    }

    const terbit = dto.published === true;
    const slug = await this.buatSlugUnik(dto.title);

    try {
      const berita = await this.prisma.article.create({
        data: {
          title: dto.title.trim(),
          slug,
          content: isi,
          excerpt: dto.excerpt?.trim() || buatRingkasan(teks),
          published: terbit,
          publishedAt: terbit ? new Date() : null,
          authorId: pengguna.id,
          categoryId: dto.categoryId,
        },
        select: { id: true, slug: true },
      });
      return { status: 'success', message: 'Berita berhasil dibuat.', data: berita };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Slug berita bentrok, silakan coba lagi.');
      }
      throw error;
    }
  }

  async ubah(pengguna: PenggunaBerita, id: string, dto: UpdateBeritaDto) {
    const berita = await this.ambilMilik(id, pengguna);

    if (dto.categoryId) {
      await this.assertKategori(dto.categoryId);
    }

    const data: Prisma.ArticleUncheckedUpdateInput = {};

    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }

    if (dto.content !== undefined) {
      const isi = bersihkanHtml(dto.content);
      const teks = ambilTeks(isi);
      if (!teks && !isi.includes('<img')) {
        throw new BadRequestException('Isi berita tidak boleh kosong.');
      }
      data.content = isi;
      if (dto.excerpt === undefined) {
        data.excerpt = buatRingkasan(teks);
      }
    }

    if (dto.excerpt !== undefined) {
      data.excerpt = dto.excerpt.trim() || null;
    }

    if (dto.categoryId !== undefined) {
      data.categoryId = dto.categoryId;
    }

    if (dto.published !== undefined) {
      data.published = dto.published;
      if (dto.published && !berita.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Tidak ada data yang diubah.');
    }

    await this.prisma.article.update({ where: { id }, data });

    return { status: 'success', message: 'Berita berhasil diperbarui.' };
  }

  async uploadGambar(pengguna: PenggunaBerita, id: string, file: Express.Multer.File | undefined) {
    const berita = await this.ambilMilik(id, pengguna);

    const valid = validateFile(file, GAMBAR_BERITA.maxBytes, GAMBAR_BERITA.tipe);
    const hasil = await olahGambarBerita(valid.buffer);
    const key = `berita/${id}/sampul-${Date.now()}.jpg`;

    await this.storage.upload(key, hasil, 'image/jpeg', 'berita');
    await this.prisma.article.update({ where: { id }, data: { thumbnail: key } });

    if (berita.thumbnail) {
      await this.storage.remove(berita.thumbnail, 'berita');
    }

    return {
      status: 'success',
      message: 'Gambar sampul berhasil diunggah.',
      data: { thumbnailUrl: this.urlGambar(key) },
    };
  }

  async hapusGambar(pengguna: PenggunaBerita, id: string) {
    const berita = await this.ambilMilik(id, pengguna);

    if (!berita.thumbnail) {
      throw new BadRequestException('Berita ini belum memiliki gambar sampul.');
    }

    await this.prisma.article.update({ where: { id }, data: { thumbnail: null } });
    await this.storage.remove(berita.thumbnail, 'berita');

    return { status: 'success', message: 'Gambar sampul berhasil dihapus.' };
  }

  async uploadGambarKonten(pengguna: PenggunaBerita, file: Express.Multer.File | undefined) {
    const valid = validateFile(file, GAMBAR_BERITA.maxBytes, GAMBAR_BERITA.tipe);
    const hasil = await olahGambarBerita(valid.buffer);
    const key = `berita/konten/${pengguna.id}/${Date.now()}-${randomBytes(3).toString('hex')}.jpg`;

    await this.storage.upload(key, hasil, 'image/jpeg', 'berita');

    return {
      status: 'success',
      message: 'Gambar berhasil diunggah.',
      data: { url: this.urlGambar(key) },
    };
  }

  async hapus(pengguna: PenggunaBerita, id: string) {
    const berita = await this.ambilMilik(id, pengguna);

    await this.prisma.article.delete({ where: { id } });

    if (berita.thumbnail) {
      await this.storage.remove(berita.thumbnail, 'berita');
    }

    return { status: 'success', message: 'Berita berhasil dihapus.' };
  }

  async daftarKategoriKelola() {
    const data = await this.prisma.articleCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { articles: true } },
      },
    });

    return {
      status: 'success',
      data: data.map(({ _count, ...item }) => ({ ...item, jumlahBerita: _count.articles })),
    };
  }

  async buatKategori(dto: CreateKategoriDto) {
    const nama = dto.name.trim();
    const slug = buatSlug(nama);

    try {
      const kategori = await this.prisma.articleCategory.create({
        data: { name: nama, slug },
      });
      return { status: 'success', message: 'Kategori berhasil dibuat.', data: kategori };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Nama kategori sudah ada.');
      }
      throw error;
    }
  }

  async ubahKategori(id: string, dto: UpdateKategoriDto) {
    const kategori = await this.prisma.articleCategory.findUnique({ where: { id } });
    if (!kategori) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    if (dto.name === undefined) {
      throw new BadRequestException('Tidak ada data yang diubah.');
    }

    const nama = dto.name.trim();

    try {
      const diperbarui = await this.prisma.articleCategory.update({
        where: { id },
        data: { name: nama, slug: buatSlug(nama) },
      });
      return { status: 'success', message: 'Kategori berhasil diperbarui.', data: diperbarui };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Nama kategori sudah ada.');
      }
      throw error;
    }
  }

  async hapusKategori(id: string) {
    const kategori = await this.prisma.articleCategory.findUnique({
      where: { id },
      include: { _count: { select: { articles: true } } },
    });
    if (!kategori) {
      throw new NotFoundException('Kategori tidak ditemukan.');
    }

    if (kategori._count.articles > 0) {
      throw new ConflictException(
        'Kategori masih dipakai oleh berita dan tidak dapat dihapus. Pindahkan beritanya dulu.',
      );
    }

    await this.prisma.articleCategory.delete({ where: { id } });
    return { status: 'success', message: 'Kategori berhasil dihapus.' };
  }
}
