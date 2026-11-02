"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KonfigurasiModule = void 0;
const common_1 = require("@nestjs/common");
const konfigurasi_service_1 = require("./konfigurasi.service");
const konfigurasi_controller_1 = require("./konfigurasi.controller");
const jurusan_controller_1 = require("./jurusan.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let KonfigurasiModule = class KonfigurasiModule {
};
exports.KonfigurasiModule = KonfigurasiModule;
exports.KonfigurasiModule = KonfigurasiModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [konfigurasi_controller_1.KonfigurasiController, jurusan_controller_1.JurusanController],
        providers: [konfigurasi_service_1.KonfigurasiService],
        exports: [konfigurasi_service_1.KonfigurasiService],
    })
], KonfigurasiModule);
//# sourceMappingURL=konfigurasi.module.js.map