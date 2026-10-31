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
exports.RegisterSiswaDto = void 0;
const class_validator_1 = require("class-validator");
class RegisterSiswaDto {
    email;
    namaLengkap;
    username;
    noHp;
    password;
    confirmPassword;
}
exports.RegisterSiswaDto = RegisterSiswaDto;
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Format email tidak valid.' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email wajib diisi!' }),
    (0, class_validator_1.MaxLength)(254),
    __metadata("design:type", String)
], RegisterSiswaDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nama lengkap wajib diisi!' }),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], RegisterSiswaDto.prototype, "namaLengkap", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Username wajib diisi!' }),
    (0, class_validator_1.Matches)(/^[A-Za-z0-9_.]{3,30}$/, {
        message: 'Username 3-30 karakter, hanya huruf, angka, titik, dan garis bawah.',
    }),
    __metadata("design:type", String)
], RegisterSiswaDto.prototype, "username", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nomor HP wajib diisi!' }),
    (0, class_validator_1.Matches)(/^(\+62|62|0)8\d{8,12}$/, { message: 'Format nomor HP tidak valid.' }),
    __metadata("design:type", String)
], RegisterSiswaDto.prototype, "noHp", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password wajib diisi!' }),
    (0, class_validator_1.MinLength)(8, { message: 'Password minimal harus 8 karakter.' }),
    (0, class_validator_1.MaxLength)(72, { message: 'Password maksimal 72 karakter.' }),
    (0, class_validator_1.Matches)(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'Password harus mengandung huruf dan angka.' }),
    __metadata("design:type", String)
], RegisterSiswaDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Konfirmasi password wajib diisi!' }),
    (0, class_validator_1.MaxLength)(72),
    __metadata("design:type", String)
], RegisterSiswaDto.prototype, "confirmPassword", void 0);
//# sourceMappingURL=register-siswa.dto.js.map