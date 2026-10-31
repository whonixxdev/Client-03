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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("./mail/mail.service");
const security_util_1 = require("./utils/security.util");
const BCRYPT_ROUNDS = 12;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const INVALID_CREDENTIALS = 'Kredensial login tidak valid.';
const INVALID_OTP = 'Kode OTP salah atau sudah kadaluwarsa.';
const RESERVED_USERNAMES = [
    'admin',
    'administrator',
    'superadmin',
    'panitia',
    'root',
    'system',
];
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwt;
    mailService;
    logger = new common_1.Logger(AuthService_1.name);
    otpSecret;
    dummyHash = bcrypt.hashSync('kata-sandi-pembanding-waktu', BCRYPT_ROUNDS);
    constructor(prisma, jwt, mailService, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.mailService = mailService;
        this.otpSecret = config.getOrThrow('JWT_SECRET');
        this.adminEmail = config.get('ADMIN_EMAIL');
        this.adminPassword = config.get('ADMIN_PASSWORD');
    }
    adminEmail;
    adminPassword;
    async onModuleInit() {
        if (!this.adminEmail || !this.adminPassword) {
            this.logger.warn('ADMIN_EMAIL dan ADMIN_PASSWORD belum diisi, akun admin default tidak dibuat.');
            return;
        }
        try {
            const email = (0, security_util_1.normalizeEmail)(this.adminEmail);
            const existingAdmin = await this.prisma.user.findUnique({
                where: { email },
            });
            if (existingAdmin) {
                return;
            }
            const hashedPassword = await bcrypt.hash(this.adminPassword, BCRYPT_ROUNDS);
            await this.prisma.user.create({
                data: {
                    email,
                    username: 'superadmin',
                    password: hashedPassword,
                    role: client_1.Role.ADMIN,
                    isVerified: true,
                },
            });
            this.logger.log('Akun admin default berhasil dibuat.');
        }
        catch (error) {
            this.logger.error('Gagal menyiapkan akun admin default.', error instanceof Error ? error.stack : undefined);
        }
    }
    hash(otp) {
        return (0, security_util_1.hashOtp)(otp, this.otpSecret);
    }
    isOnCooldown(user) {
        if (!user.otpExpiredAt) {
            return false;
        }
        const sentAt = user.otpExpiredAt.getTime() - OTP_TTL_MS;
        return sentAt + OTP_COOLDOWN_MS > Date.now();
    }
    clearedOtpData() {
        return {
            otpCode: null,
            otpExpiredAt: null,
            otpPurpose: null,
            otpAttempts: 0,
        };
    }
    async issueOtp(userId, purpose) {
        const otp = (0, security_util_1.generateOtp)();
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                otpCode: this.hash(otp),
                otpExpiredAt: new Date(Date.now() + OTP_TTL_MS),
                otpPurpose: purpose,
                otpAttempts: 0,
            },
        });
        return otp;
    }
    async assertOtp(user, code) {
        if (!user.otpCode ||
            !user.otpExpiredAt ||
            user.otpExpiredAt.getTime() < Date.now()) {
            throw new common_1.BadRequestException(INVALID_OTP);
        }
        const attempt = await this.prisma.user.updateMany({
            where: { id: user.id, otpAttempts: { lt: OTP_MAX_ATTEMPTS } },
            data: { otpAttempts: { increment: 1 } },
        });
        if (attempt.count === 0) {
            throw new common_1.HttpException('Terlalu banyak percobaan. Silakan minta kode OTP baru.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (!(0, security_util_1.safeEqual)(user.otpCode, this.hash(code))) {
            throw new common_1.BadRequestException(INVALID_OTP);
        }
    }
    async sendOtp(email, otp, purpose) {
        try {
            if (purpose === client_1.OtpPurpose.RESET) {
                await this.mailService.sendForgotPasswordOtp(email, otp);
            }
            else {
                await this.mailService.sendOtpEmail(email, otp);
            }
            return true;
        }
        catch (error) {
            this.logger.error(`Gagal mengirim OTP ke ${email}`, error instanceof Error ? error.stack : undefined);
            return false;
        }
    }
    async checkPassword(plain, hash) {
        const result = await bcrypt.compare(plain, hash ?? this.dummyHash);
        return hash !== undefined && result;
    }
    async buildAuthResponse(user, message) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await this.jwt.signAsync(payload);
        return {
            status: 'success',
            message,
            access_token: accessToken,
            token_type: 'Bearer',
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                panitiaId: user.panitiaId,
            },
        };
    }
    async assertAccountAvailable(email, username) {
        if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
            throw new common_1.BadRequestException('Username tidak diperbolehkan.');
        }
        const existingEmail = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingEmail) {
            throw new common_1.BadRequestException('Email sudah terdaftar!');
        }
        const existingUsername = await this.prisma.user.findUnique({
            where: { username },
        });
        if (existingUsername) {
            throw new common_1.BadRequestException('Username sudah digunakan!');
        }
    }
    async nextPanitiaId(year) {
        const latest = await this.prisma.user.findFirst({
            where: { panitiaId: { startsWith: `PNT-${year}-` } },
            orderBy: { createdAt: 'desc' },
            select: { panitiaId: true },
        });
        const lastNumber = latest?.panitiaId
            ? parseInt(latest.panitiaId.split('-').pop() ?? '0', 10)
            : 0;
        return `PNT-${year}-${String(lastNumber + 1).padStart(3, '0')}`;
    }
    async registerSiswa(dto) {
        if (dto.password !== dto.confirmPassword) {
            throw new common_1.BadRequestException('Konfirmasi password tidak cocok!');
        }
        const email = (0, security_util_1.normalizeEmail)(dto.email);
        const username = (0, security_util_1.normalizeUsername)(dto.username);
        await this.assertAccountAvailable(email, username);
        const otp = (0, security_util_1.generateOtp)();
        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        let user;
        try {
            user = await this.prisma.user.create({
                data: {
                    email,
                    username,
                    password: hashedPassword,
                    role: client_1.Role.SISWA,
                    isVerified: false,
                    otpCode: this.hash(otp),
                    otpExpiredAt: new Date(Date.now() + OTP_TTL_MS),
                    otpPurpose: client_1.OtpPurpose.REGISTER,
                    otpAttempts: 0,
                    biodata: {
                        create: {
                            namaLengkap: dto.namaLengkap.trim(),
                            noHpSiswa: dto.noHp.trim(),
                        },
                    },
                    berkas: {
                        create: {
                            statusVerifikasi: 'PENDING',
                        },
                    },
                },
            });
        }
        catch (error) {
            if ((0, security_util_1.isUniqueViolation)(error)) {
                throw new common_1.ConflictException('Email atau username sudah digunakan!');
            }
            throw error;
        }
        const sent = await this.sendOtp(user.email, otp, client_1.OtpPurpose.REGISTER);
        if (!sent) {
            throw new common_1.ServiceUnavailableException('Akun dibuat, tetapi email OTP gagal dikirim. Silakan gunakan kirim ulang OTP.');
        }
        return {
            status: 'success',
            message: 'Kode OTP registrasi berhasil dikirim ke email',
        };
    }
    async registerPanitia(dto) {
        if (dto.password !== dto.confirmPassword) {
            throw new common_1.BadRequestException('Konfirmasi password tidak cocok!');
        }
        const email = (0, security_util_1.normalizeEmail)(dto.email);
        const username = (0, security_util_1.normalizeUsername)(dto.username);
        await this.assertAccountAvailable(email, username);
        const otp = (0, security_util_1.generateOtp)();
        const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const year = new Date().getFullYear();
        for (let attempt = 0; attempt < 5; attempt++) {
            const panitiaId = await this.nextPanitiaId(year);
            try {
                const user = await this.prisma.user.create({
                    data: {
                        email,
                        username,
                        password: hashedPassword,
                        panitiaId,
                        role: client_1.Role.PANITIA,
                        isVerified: false,
                        otpCode: this.hash(otp),
                        otpExpiredAt: new Date(Date.now() + OTP_TTL_MS),
                        otpPurpose: client_1.OtpPurpose.REGISTER,
                        otpAttempts: 0,
                    },
                });
                const sent = await this.sendOtp(user.email, otp, client_1.OtpPurpose.REGISTER);
                if (!sent) {
                    throw new common_1.ServiceUnavailableException('Akun panitia dibuat, tetapi email OTP gagal dikirim. Silakan gunakan kirim ulang OTP.');
                }
                return {
                    status: 'success',
                    message: 'Registrasi panitia berhasil. Kode OTP dikirim ke email.',
                    panitiaId,
                };
            }
            catch (error) {
                if ((0, security_util_1.isUniqueViolation)(error)) {
                    continue;
                }
                throw error;
            }
        }
        throw new common_1.ConflictException('Gagal membuat ID panitia, silakan coba lagi.');
    }
    async verifyOtp(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: (0, security_util_1.normalizeEmail)(dto.email) },
        });
        if (!user || user.isVerified || user.otpPurpose !== client_1.OtpPurpose.REGISTER) {
            throw new common_1.BadRequestException(INVALID_OTP);
        }
        await this.assertOtp(user, dto.otpCode);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true, ...this.clearedOtpData() },
        });
        return this.buildAuthResponse(user, 'Registrasi dan verifikasi email berhasil');
    }
    async resendOtp(dto) {
        const genericResponse = {
            status: 'success',
            message: 'Jika akun terdaftar dan belum diverifikasi, kode OTP baru telah dikirim ke email.',
        };
        const user = await this.prisma.user.findUnique({
            where: { email: (0, security_util_1.normalizeEmail)(dto.email) },
        });
        if (!user || user.isVerified || this.isOnCooldown(user)) {
            return genericResponse;
        }
        const otp = await this.issueOtp(user.id, client_1.OtpPurpose.REGISTER);
        await this.sendOtp(user.email, otp, client_1.OtpPurpose.REGISTER);
        return genericResponse;
    }
    async login(dto) {
        const identifier = dto.identifier.trim();
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
            },
        });
        const valid = await this.checkPassword(dto.password, user?.password);
        if (!user || !valid || user.role !== client_1.Role.SISWA) {
            throw new common_1.UnauthorizedException(INVALID_CREDENTIALS);
        }
        if (!user.isVerified) {
            throw new common_1.UnauthorizedException('Akun belum diverifikasi dengan OTP.');
        }
        return this.buildAuthResponse(user, 'Login berhasil');
    }
    async loginPanitia(dto) {
        if (dto.panitiaId) {
            const user = await this.prisma.user.findUnique({
                where: { panitiaId: (0, security_util_1.normalizePanitiaId)(dto.panitiaId) },
            });
            const valid = await this.checkPassword(dto.password, user?.password);
            if (!user || !valid || user.role !== client_1.Role.PANITIA || !user.isVerified) {
                throw new common_1.UnauthorizedException(INVALID_CREDENTIALS);
            }
            return this.buildAuthResponse(user, 'Login panitia via ID berhasil');
        }
        if (dto.email) {
            const user = await this.prisma.user.findUnique({
                where: { email: (0, security_util_1.normalizeEmail)(dto.email) },
            });
            const valid = await this.checkPassword(dto.password, user?.password);
            if (!user ||
                !valid ||
                !user.isVerified ||
                (user.role !== client_1.Role.PANITIA && user.role !== client_1.Role.ADMIN)) {
                throw new common_1.UnauthorizedException(INVALID_CREDENTIALS);
            }
            if (!dto.otpCode) {
                if (this.isOnCooldown(user)) {
                    return {
                        status: 'success',
                        requiresOtp: true,
                        message: 'Kode OTP sebelumnya masih berlaku. Periksa email Anda atau tunggu satu menit untuk meminta ulang.',
                    };
                }
                const otp = await this.issueOtp(user.id, client_1.OtpPurpose.LOGIN);
                const sent = await this.sendOtp(user.email, otp, client_1.OtpPurpose.LOGIN);
                if (!sent) {
                    throw new common_1.ServiceUnavailableException('Email OTP gagal dikirim. Silakan coba lagi.');
                }
                return {
                    status: 'success',
                    requiresOtp: true,
                    message: 'Kode OTP verifikasi login telah dikirim ke email.',
                };
            }
            if (user.otpPurpose !== client_1.OtpPurpose.LOGIN) {
                throw new common_1.BadRequestException(INVALID_OTP);
            }
            await this.assertOtp(user, dto.otpCode);
            await this.prisma.user.update({
                where: { id: user.id },
                data: this.clearedOtpData(),
            });
            return this.buildAuthResponse(user, 'Login via Email & OTP berhasil');
        }
        throw new common_1.BadRequestException('Harap masukkan ID Panitia atau Email.');
    }
    async forgotPassword(dto) {
        const genericResponse = {
            status: 'success',
            message: 'Jika akun terdaftar, kode OTP reset password telah dikirim ke email.',
        };
        let user = null;
        if (dto.email) {
            user = await this.prisma.user.findUnique({
                where: { email: (0, security_util_1.normalizeEmail)(dto.email) },
            });
        }
        else if (dto.username) {
            user = await this.prisma.user.findUnique({
                where: { username: (0, security_util_1.normalizeUsername)(dto.username) },
            });
        }
        else {
            throw new common_1.BadRequestException('Harap masukkan username atau email.');
        }
        if (!user || !user.isVerified || this.isOnCooldown(user)) {
            return genericResponse;
        }
        const otp = await this.issueOtp(user.id, client_1.OtpPurpose.RESET);
        await this.sendOtp(user.email, otp, client_1.OtpPurpose.RESET);
        return genericResponse;
    }
    async resetPassword(dto) {
        if (dto.newPassword !== dto.confirmPassword) {
            throw new common_1.BadRequestException('Konfirmasi password tidak cocok!');
        }
        const user = await this.prisma.user.findUnique({
            where: { email: (0, security_util_1.normalizeEmail)(dto.email) },
        });
        if (!user || user.otpPurpose !== client_1.OtpPurpose.RESET) {
            throw new common_1.BadRequestException(INVALID_OTP);
        }
        await this.assertOtp(user, dto.otpCode);
        const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, ...this.clearedOtpData() },
        });
        return {
            status: 'success',
            message: 'Password berhasil diubah. Silakan login dengan password baru.',
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        mail_service_1.MailService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map