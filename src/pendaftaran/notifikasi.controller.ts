import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { NotifikasiService } from './notifikasi.service';
import { QueryNotifikasiDto } from './dto/query-notifikasi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('pendaftaran/notifikasi')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SISWA)
export class NotifikasiController {
  constructor(private readonly notifikasiService: NotifikasiService) {}

  @Get()
  daftar(@GetUser('id') userId: string, @Query() query: QueryNotifikasiDto) {
    return this.notifikasiService.daftar(userId, query);
  }

  @Get('jumlah')
  jumlah(@GetUser('id') userId: string) {
    return this.notifikasiService.jumlahBelumDibaca(userId);
  }

  @Post('baca-semua')
  @HttpCode(HttpStatus.OK)
  bacaSemua(@GetUser('id') userId: string) {
    return this.notifikasiService.bacaSemua(userId);
  }

  @Patch(':id/baca')
  @HttpCode(HttpStatus.OK)
  tandaiBaca(@GetUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifikasiService.tandaiBaca(userId, id);
  }
}
