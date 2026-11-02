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
exports.KonfigurasiController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const konfigurasi_service_1 = require("./konfigurasi.service");
const jurusan_dto_1 = require("./dto/jurusan.dto");
const gelombang_dto_1 = require("./dto/gelombang.dto");
const pengaturan_dto_1 = require("./dto/pengaturan.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let KonfigurasiController = class KonfigurasiController {
    konfigurasiService;
    constructor(konfigurasiService) {
        this.konfigurasiService = konfigurasiService;
    }
    daftarJurusan() {
        return this.konfigurasiService.daftarJurusan(false);
    }
    buatJurusan(dto) {
        return this.konfigurasiService.buatJurusan(dto);
    }
    ubahJurusan(id, dto) {
        return this.konfigurasiService.ubahJurusan(id, dto);
    }
    hapusJurusan(id) {
        return this.konfigurasiService.hapusJurusan(id);
    }
    daftarGelombang() {
        return this.konfigurasiService.daftarGelombang();
    }
    buatGelombang(dto) {
        return this.konfigurasiService.buatGelombang(dto);
    }
    ubahGelombang(id, dto) {
        return this.konfigurasiService.ubahGelombang(id, dto);
    }
    hapusGelombang(id) {
        return this.konfigurasiService.hapusGelombang(id);
    }
    daftarPengaturan() {
        return this.konfigurasiService.daftarPengaturan();
    }
    ubahPengaturan(dto) {
        return this.konfigurasiService.ubahPengaturan(dto);
    }
};
exports.KonfigurasiController = KonfigurasiController;
__decorate([
    (0, common_1.Get)('jurusan'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.PANITIA),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "daftarJurusan", null);
__decorate([
    (0, common_1.Post)('jurusan'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [jurusan_dto_1.CreateJurusanDto]),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "buatJurusan", null);
__decorate([
    (0, common_1.Patch)('jurusan/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, jurusan_dto_1.UpdateJurusanDto]),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "ubahJurusan", null);
__decorate([
    (0, common_1.Delete)('jurusan/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "hapusJurusan", null);
__decorate([
    (0, common_1.Get)('gelombang'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.PANITIA),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "daftarGelombang", null);
__decorate([
    (0, common_1.Post)('gelombang'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gelombang_dto_1.CreateGelombangDto]),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "buatGelombang", null);
__decorate([
    (0, common_1.Patch)('gelombang/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, gelombang_dto_1.UpdateGelombangDto]),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "ubahGelombang", null);
__decorate([
    (0, common_1.Delete)('gelombang/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "hapusGelombang", null);
__decorate([
    (0, common_1.Get)('pengaturan'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.PANITIA),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "daftarPengaturan", null);
__decorate([
    (0, common_1.Put)('pengaturan'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pengaturan_dto_1.PengaturanDto]),
    __metadata("design:returntype", void 0)
], KonfigurasiController.prototype, "ubahPengaturan", null);
exports.KonfigurasiController = KonfigurasiController = __decorate([
    (0, common_1.Controller)('konfigurasi'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    __metadata("design:paramtypes", [konfigurasi_service_1.KonfigurasiService])
], KonfigurasiController);
//# sourceMappingURL=konfigurasi.controller.js.map