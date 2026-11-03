import { Module } from '@nestjs/common';
import { PendaftaranService } from './pendaftaran.service';
import { PanitiaService } from './panitia.service';
import { NotifikasiService } from './notifikasi.service';
import { PendaftaranController } from './pendaftaran.controller';
import { PanitiaController } from './panitia.controller';
import { NotifikasiController } from './notifikasi.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { KonfigurasiModule } from '../configuration/konfigurasi.module';

@Module({
  imports: [PrismaModule, StorageModule, KonfigurasiModule],
  controllers: [PendaftaranController, PanitiaController, NotifikasiController],
  providers: [PendaftaranService, PanitiaService, NotifikasiService],
  exports: [PendaftaranService],
})
export class PendaftaranModule {}
