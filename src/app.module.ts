import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { BeritaModule } from './berita/berita.module';
import { KonfigurasiModule } from './configuration/konfigurasi.module';
import { PendaftaranModule } from './pendaftaran/pendaftaran.module';
import { ProfilModule } from './profil/profil.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    AuditModule,
    AuthModule,
    KonfigurasiModule,
    PendaftaranModule,
    ProfilModule,
    BeritaModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
