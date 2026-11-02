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
exports.CreateBiodataDto = void 0;
const class_validator_1 = require("class-validator");
const NOMOR_HP = /^(\+62|62|0)8\d{8,12}$/;
class CreateBiodataDto {
    namaLengkap;
    nik;
    nisn;
    nis;
    jenisKelamin;
    tempatLahir;
    tanggalLahir;
    agama;
    alamat;
    noHpSiswa;
    namaAyah;
    noHpAyah;
    namaIbu;
    noHpIbu;
    asalSmp;
    jurusanId;
    jurusanCadanganId;
}
exports.CreateBiodataDto = CreateBiodataDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama lengkap wajib diisi!' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "namaLengkap", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{16}$/, { message: 'NIK harus 16 digit angka.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "nik", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{10}$/, { message: 'NISN harus 10 digit angka.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "nisn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{3,20}$/, { message: 'NIS harus 3-20 digit angka.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "nis", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['Laki-laki', 'Perempuan'], { message: 'Jenis kelamin harus Laki-laki atau Perempuan.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "jenisKelamin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "tempatLahir", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Format tanggal lahir tidak valid.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "tanggalLahir", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'], {
        message: 'Agama tidak valid.',
    }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "agama", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "alamat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(NOMOR_HP, { message: 'Format nomor HP siswa tidak valid.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "noHpSiswa", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "namaAyah", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(NOMOR_HP, { message: 'Format nomor HP ayah tidak valid.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "noHpAyah", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "namaIbu", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(NOMOR_HP, { message: 'Format nomor HP ibu tidak valid.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "noHpIbu", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "asalSmp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('all', { message: 'Jurusan utama tidak valid.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "jurusanId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('all', { message: 'Jurusan cadangan tidak valid.' }),
    __metadata("design:type", String)
], CreateBiodataDto.prototype, "jurusanCadanganId", void 0);
//# sourceMappingURL=biodata.dto.js.map