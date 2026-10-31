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
exports.LoginPanitiaDto = void 0;
const class_validator_1 = require("class-validator");
class LoginPanitiaDto {
    panitiaId;
    email;
    password;
    otpCode;
}
exports.LoginPanitiaDto = LoginPanitiaDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], LoginPanitiaDto.prototype, "panitiaId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Format email tidak valid.' }),
    (0, class_validator_1.MaxLength)(254),
    __metadata("design:type", String)
], LoginPanitiaDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Password wajib diisi!' }),
    (0, class_validator_1.MaxLength)(72),
    __metadata("design:type", String)
], LoginPanitiaDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d{6}$/, { message: 'Kode OTP harus tepat 6 digit angka.' }),
    __metadata("design:type", String)
], LoginPanitiaDto.prototype, "otpCode", void 0);
//# sourceMappingURL=login-panitia.dto.js.map