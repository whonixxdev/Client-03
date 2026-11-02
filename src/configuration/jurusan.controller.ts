import { Controller, Get, UseGuards } from '@nestjs/common';
import { KonfigurasiService } from './konfigurasi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('jurusan')
@UseGuards(JwtAuthGuard)
export class JurusanController {
  constructor(private readonly konfigurasiService: KonfigurasiService) {}

  @Get()
  daftarJurusan() {
    return this.konfigurasiService.daftarJurusan(true);
  }
}
