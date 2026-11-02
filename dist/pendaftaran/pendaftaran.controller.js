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
exports.PendaftaranController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const throttler_1 = require("@nestjs/throttler");
const client_1 = require("@prisma/client");
const pendaftaran_service_1 = require("./pendaftaran.service");
const biodata_dto_1 = require("./dto/biodata.dto");
const pembayaran_dto_1 = require("./dto/pembayaran.dto");
const berkas_config_1 = require("./utils/berkas.config");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
let PendaftaranController = class PendaftaranController {
    pendaftaranService;
    constructor(pendaftaranService) {
        this.pendaftaranService = pendaftaranService;
    }
    getMyPendaftaran(userId) {
        return this.pendaftaranService.getMyPendaftaran(userId);
    }
    upsertBiodata(userId, dto) {
        return this.pendaftaranService.upsertBiodata(userId, dto);
    }
    uploadAvatar(userId, file) {
        return this.pendaftaranService.uploadAvatar(userId, file);
    }
    uploadBerkas(userId, jenis, file) {
        return this.pendaftaranService.uploadBerkas(userId, jenis, file);
    }
    ajukan(userId) {
        return this.pendaftaranService.ajukan(userId);
    }
    submitPembayaran(userId, dto, bukti) {
        return this.pendaftaranService.submitPembayaran(userId, dto, bukti);
    }
};
exports.PendaftaranController = PendaftaranController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PendaftaranController.prototype, "getMyPendaftaran", null);
__decorate([
    (0, common_1.Post)('biodata'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, biodata_dto_1.CreateBiodataDto]),
    __metadata("design:returntype", void 0)
], PendaftaranController.prototype, "upsertBiodata", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: berkas_config_1.AVATAR.maxBytes, files: 1 } })),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PendaftaranController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('berkas/:jenis'),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: berkas_config_1.UNGGAH_BERKAS_MAKS, files: 1 } })),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Param)('jenis')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], PendaftaranController.prototype, "uploadBerkas", null);
__decorate([
    (0, common_1.Post)('ajukan'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 60000 } }),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PendaftaranController.prototype, "ajukan", null);
__decorate([
    (0, common_1.Post)('pembayaran'),
    (0, throttler_1.Throttle)({ default: { limit: 10, ttl: 60000 } }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('bukti', { limits: { fileSize: berkas_config_1.BUKTI_PEMBAYARAN.maxBytes, files: 1 } })),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pembayaran_dto_1.CreatePembayaranDto, Object]),
    __metadata("design:returntype", void 0)
], PendaftaranController.prototype, "submitPembayaran", null);
exports.PendaftaranController = PendaftaranController = __decorate([
    (0, common_1.Controller)('pendaftaran'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.SISWA),
    __metadata("design:paramtypes", [pendaftaran_service_1.PendaftaranService])
], PendaftaranController);
//# sourceMappingURL=pendaftaran.controller.js.map