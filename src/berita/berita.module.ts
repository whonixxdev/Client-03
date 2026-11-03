import { Module } from '@nestjs/common';
import { BeritaService } from './berita.service';
import {
  BeritaKelolaController,
  BeritaPublikController,
  KategoriBeritaController,
} from './berita.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [BeritaPublikController, BeritaKelolaController, KategoriBeritaController],
  providers: [BeritaService],
})
export class BeritaModule {}
