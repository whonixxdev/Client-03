"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PanitiaController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const client_1 = require("@prisma/client");
const panitia_service_1 = require("./panitia.service");
const daftar_ulang_dto_1 = require("./dto/daftar-ulang.dto");
const konfirmasi_pembayaran_dto_1 = require("./dto/konfirmasi-pembayaran.dto");
const query_panitia_dto_1 = require("./dto/query-panitia.dto");
const verifikasi_dto_1 = require("./dto/verifikasi.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
let PanitiaController = class PanitiaController {
    panitiaService;
    constructor(panitiaService) {
        this.panitiaService = panitiaService;
    }
    getAll(query) {
        return this.panitiaService.getAll(query);
    }
    async exportExcel(aktor, query, res) {
        const buffer = await this.panitiaService.exportExcel(aktor, query);
        const tanggal = new Date().toISOString().slice(0, 10);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="data-pendaftar-${tanggal}.xlsx"`,
        });
        return new common_1.StreamableFile(buffer);
    }
    getDetail(userId) {
        return this.panitiaService.getDetail(userId);
    }
    verifikasi(aktor, userId, dto) {
        return this.panitiaService.verifikasi(aktor, userId, dto);
    }
    konfirmasiPembayaran(aktor, userId, dto) {
        return this.panitiaService.konfirmasiPembayaran(aktor, userId, dto);
    }
    daftarUlang(aktor, userId, dto) {
        return this.panitiaService.daftarUlang(aktor, userId, dto);
    }
};
exports.PanitiaController = PanitiaController;
__decorate([
    (0, common_1.Get)('all'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_panitia_dto_1.QueryPanitiaDto]),
    __metadata("design:returntype", void 0)
], PanitiaController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_panitia_dto_1.QueryPanitiaDto, Object]),
    __metadata("design:returntype", Promise)
], PanitiaController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PanitiaController.prototype, "getDetail", null);
__decorate([
    (0, common_1.Patch)(':userId/verifikasi'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, verifikasi_dto_1.VerifikasiDto]),
    __metadata("design:returntype", void 0)
], PanitiaController.prototype, "verifikasi", null);
__decorate([
    (0, common_1.Patch)(':userId/pembayaran'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, konfirmasi_pembayaran_dto_1.KonfirmasiPembayaranDto]),
    __metadata("design:returntype", void 0)
], PanitiaController.prototype, "konfirmasiPembayaran", null);
__decorate([
    (0, common_1.Patch)(':userId/daftar-ulang'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __param(1, (0, common_1.Param)('userId', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, daftar_ulang_dto_1.DaftarUlangDto]),
    __metadata("design:returntype", void 0)
], PanitiaController.prototype, "daftarUlang", null);
exports.PanitiaController = PanitiaController = __decorate([
    (0, common_1.Controller)('pendaftaran/panitia'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.PANITIA, client_1.Role.ADMIN),
    __metadata("design:paramtypes", [panitia_service_1.PanitiaService])
], PanitiaController);
//# sourceMappingURL=panitia.controller.js.map