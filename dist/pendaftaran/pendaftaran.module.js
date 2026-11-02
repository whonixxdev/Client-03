"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PendaftaranModule = void 0;
const common_1 = require("@nestjs/common");
const pendaftaran_service_1 = require("./pendaftaran.service");
const panitia_service_1 = require("./panitia.service");
const pendaftaran_controller_1 = require("./pendaftaran.controller");
const panitia_controller_1 = require("./panitia.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const storage_module_1 = require("../storage/storage.module");
const konfigurasi_module_1 = require("../configuration/konfigurasi.module");
let PendaftaranModule = class PendaftaranModule {
};
exports.PendaftaranModule = PendaftaranModule;
exports.PendaftaranModule = PendaftaranModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, storage_module_1.StorageModule, konfigurasi_module_1.KonfigurasiModule],
        controllers: [pendaftaran_controller_1.PendaftaranController, panitia_controller_1.PanitiaController],
        providers: [pendaftaran_service_1.PendaftaranService, panitia_service_1.PanitiaService],
    })
], PendaftaranModule);
//# sourceMappingURL=pendaftaran.module.js.map