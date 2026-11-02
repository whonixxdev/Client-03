import { Module } from '@nestjs/common';
import { PendaftaranService } from './pendaftaran.service';
import { PanitiaService } from './panitia.service';
import { PendaftaranController } from './pendaftaran.controller';
import { PanitiaController } from './panitia.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { KonfigurasiModule } from '../configuration/konfigurasi.module';

@Module({
  imports: [PrismaModule, StorageModule, KonfigurasiModule],
  controllers: [PendaftaranController, PanitiaController],
  providers: [PendaftaranService, PanitiaService],
})
export class PendaftaranModule {}
