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
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryPanitiaDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class QueryPanitiaDto {
    page;
    limit;
    search;
    jurusanId;
    gelombangId;
    statusFormulir;
    statusBerkas;
    statusPembayaran;
    statusDaftarUlang;
    diajukan;
}
exports.QueryPanitiaDto = QueryPanitiaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryPanitiaDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryPanitiaDto.prototype, "limit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], QueryPanitiaDto.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('all'),
    __metadata("design:type", String)
], QueryPanitiaDto.prototype, "jurusanId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('all'),
    __metadata("design:type", String)
], QueryPanitiaDto.prototype, "gelombangId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.StatusVerifikasi),
    __metadata("design:type", String)
], QueryPanitiaDto.prototype, "statusFormulir", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.StatusVerifikasi),
    __metadata("design:type", String)
], QueryPanitiaDto.prototype, "statusBerkas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.StatusVerifikasi),
    __metadata("design:type", String)
], QueryPanitiaDto.prototype, "statusPembayaran", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.StatusRegistrasiUlang),
    __metadata("design:type", String)
], QueryPanitiaDto.prototype, "statusDaftarUlang", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryPanitiaDto.prototype, "diajukan", void 0);
//# sourceMappingURL=query-panitia.dto.js.map