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
exports.UpdateJurusanDto = exports.CreateJurusanDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const class_validator_1 = require("class-validator");
class CreateJurusanDto {
    namaJurusan;
    kuota;
    biayaPendaftaran;
    aktif;
}
exports.CreateJurusanDto = CreateJurusanDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama jurusan wajib diisi!' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateJurusanDto.prototype, "namaJurusan", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Kuota harus berupa bilangan bulat.' }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100000),
    __metadata("design:type", Number)
], CreateJurusanDto.prototype, "kuota", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }, { message: 'Biaya pendaftaran tidak valid.' }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateJurusanDto.prototype, "biayaPendaftaran", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateJurusanDto.prototype, "aktif", void 0);
class UpdateJurusanDto extends (0, mapped_types_1.PartialType)(CreateJurusanDto) {
}
exports.UpdateJurusanDto = UpdateJurusanDto;
//# sourceMappingURL=jurusan.dto.js.map