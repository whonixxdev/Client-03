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
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let MailService = class MailService {
    config;
    transporter;
    constructor(config) {
        this.config = config;
        this.transporter = nodemailer.createTransport({
            host: this.config.get('MAIL_HOST'),
            port: Number(this.config.get('MAIL_PORT') ?? 587),
            secure: false,
            requireTLS: true,
            auth: {
                user: this.config.get('MAIL_USER'),
                pass: this.config.get('MAIL_PASSWORD'),
            },
        });
    }
    async sendOtpEmail(email, otp) {
        const messageContent = `Berikut adalah kode OTP Anda untuk verifikasi akun Anda di SMK TI Bali Global:\n\n` +
            `Kode OTP: ${otp}\n\n` +
            `Kode OTP ini bersifat rahasia dan hanya dapat digunakan satu kali. Demi keamanan akun Anda, jangan membagikan kode OTP ini kepada siapa pun.\n\n` +
            `Hormat kami,\n` +
            `SMK TI Bali Global`;
        const mailOptions = {
            from: `"${this.config.get('MAIL_FROM_NAME')}" <${this.config.get('MAIL_FROM_ADDRESS')}>`,
            to: email,
            subject: 'Kode OTP Verifikasi Registrasi - SMK TI Bali Global',
            text: messageContent,
        };
        await this.transporter.sendMail(mailOptions);
    }
    async sendForgotPasswordOtp(email, otp) {
        const messageContent = `Berikut adalah kode OTP Anda untuk reset password di SMK TI Bali Global:\n\n` +
            `Kode OTP: ${otp}\n\n` +
            `Kode OTP ini bersifat rahasia. Demi keamanan akun Anda, jangan membagikan kode OTP ini kepada siapa pun.\n\n` +
            `Hormat kami,\n` +
            `SMK TI Bali Global`;
        const mailOptions = {
            from: `"${this.config.get('MAIL_FROM_NAME')}" <${this.config.get('MAIL_FROM_ADDRESS')}>`,
            to: email,
            subject: 'Kode OTP Reset Password - SMK TI Bali Global',
            text: messageContent,
        };
        await this.transporter.sendMail(mailOptions);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map