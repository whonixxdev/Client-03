import { Module } from '@nestjs/common';
import { ProfilService } from './profil.service';
import { ProfilController } from './profil.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { PendaftaranModule } from '../pendaftaran/pendaftaran.module';

@Module({
  imports: [PrismaModule, StorageModule, PendaftaranModule],
  controllers: [ProfilController],
  providers: [ProfilService],
})
export class ProfilModule {}
