import { Module } from '@nestjs/common';
import { KonfigurasiService } from './konfigurasi.service';
import { KonfigurasiController } from './konfigurasi.controller';
import { JurusanController } from './jurusan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KonfigurasiController, JurusanController],
  providers: [KonfigurasiService],
  exports: [KonfigurasiService],
})
export class KonfigurasiModule {}
