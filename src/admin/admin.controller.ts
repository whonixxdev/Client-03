import {
  Body,
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
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { QueryAkunPanitiaDto, QueryAuditDto, UbahStatusAkunDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../audit/audit.decorator';

@Controller('statistik')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.PANITIA)
export class StatistikController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  statistik() {
    return this.adminService.statistik();
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('panitia')
  daftarPanitia(@Query() query: QueryAkunPanitiaDto) {
    return this.adminService.daftarPanitia(query);
  }

  @Patch('panitia/:id/status')
  @HttpCode(HttpStatus.OK)
  @Audit('PANITIA_STATUS')
  ubahStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UbahStatusAkunDto) {
    return this.adminService.ubahStatusPanitia(id, dto.aktif);
  }

  @Post('panitia/:id/buka-kunci')
  @HttpCode(HttpStatus.OK)
  @Audit('PANITIA_BUKA_KUNCI')
  bukaKunci(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.bukaKunciPanitia(id);
  }

  @Get('audit')
  audit(@Query() query: QueryAuditDto) {
    return this.auditService.daftar(query);
  }
}
