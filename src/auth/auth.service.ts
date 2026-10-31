import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OtpPurpose, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterSiswaDto } from './dto/register-siswa.dto';
import { RegisterPanitiaDto } from './dto/register-panitia.dto';
import { LoginDto } from './dto/login.dto';
import { LoginPanitiaDto } from './dto/login-panitia.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { MailService } from './mail/mail.service';
import {
  generateOtp,
  hashOtp,
  isUniqueViolation,
  normalizeEmail,
  normalizePanitiaId,
  normalizeUsername,
  safeEqual,
} from './utils/security.util';

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

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpSecret: string;
  private readonly dummyHash = bcrypt.hashSync(
    'kata-sandi-pembanding-waktu',
    BCRYPT_ROUNDS,
  );

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailService: MailService,
    config: ConfigService,
  ) {
    this.otpSecret = config.getOrThrow<string>('JWT_SECRET');
    this.adminEmail = config.get<string>('ADMIN_EMAIL');
    this.adminPassword = config.get<string>('ADMIN_PASSWORD');
  }

  private readonly adminEmail: string | undefined;
  private readonly adminPassword: string | undefined;

  async onModuleInit() {
    if (!this.adminEmail || !this.adminPassword) {
      this.logger.warn(
        'ADMIN_EMAIL dan ADMIN_PASSWORD belum diisi, akun admin default tidak dibuat.',
      );
      return;
    }

    try {
      const email = normalizeEmail(this.adminEmail);
      const existingAdmin = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingAdmin) {
        return;
      }

      const hashedPassword = await bcrypt.hash(
        this.adminPassword,
        BCRYPT_ROUNDS,
      );
      await this.prisma.user.create({
        data: {
          email,
          username: 'superadmin',
          password: hashedPassword,
          role: Role.ADMIN,
          isVerified: true,
        },
      });
      this.logger.log('Akun admin default berhasil dibuat.');
    } catch (error) {
      this.logger.error(
        'Gagal menyiapkan akun admin default.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private hash(otp: string): string {
    return hashOtp(otp, this.otpSecret);
  }

  private isOnCooldown(user: User): boolean {
    if (!user.otpExpiredAt) {
      return false;
    }
    const sentAt = user.otpExpiredAt.getTime() - OTP_TTL_MS;
    return sentAt + OTP_COOLDOWN_MS > Date.now();
  }

  private clearedOtpData() {
    return {
      otpCode: null,
      otpExpiredAt: null,
      otpPurpose: null,
      otpAttempts: 0,
    };
  }

  private async issueOtp(userId: string, purpose: OtpPurpose): Promise<string> {
    const otp = generateOtp();
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

  private async assertOtp(user: User, code: string): Promise<void> {
    if (
      !user.otpCode ||
      !user.otpExpiredAt ||
      user.otpExpiredAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(INVALID_OTP);
    }

    const attempt = await this.prisma.user.updateMany({
      where: { id: user.id, otpAttempts: { lt: OTP_MAX_ATTEMPTS } },
      data: { otpAttempts: { increment: 1 } },
    });
    if (attempt.count === 0) {
      throw new HttpException(
        'Terlalu banyak percobaan. Silakan minta kode OTP baru.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!safeEqual(user.otpCode, this.hash(code))) {
      throw new BadRequestException(INVALID_OTP);
    }
  }

  private async sendOtp(
    email: string,
    otp: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    try {
      if (purpose === OtpPurpose.RESET) {
        await this.mailService.sendForgotPasswordOtp(email, otp);
      } else {
        await this.mailService.sendOtpEmail(email, otp);
      }
      return true;
    } catch (error) {
      this.logger.error(
        `Gagal mengirim OTP ke ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  private async checkPassword(plain: string, hash?: string): Promise<boolean> {
    const result = await bcrypt.compare(plain, hash ?? this.dummyHash);
    return hash !== undefined && result;
  }

  private async buildAuthResponse(user: User, message: string) {
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

  private async assertAccountAvailable(
    email: string,
    username: string,
  ): Promise<void> {
    if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
      throw new BadRequestException('Username tidak diperbolehkan.');
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new BadRequestException('Email sudah terdaftar!');
    }

    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new BadRequestException('Username sudah digunakan!');
    }
  }

  private async nextPanitiaId(year: number): Promise<string> {
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

  async registerSiswa(dto: RegisterSiswaDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Konfirmasi password tidak cocok!');
    }

    const email = normalizeEmail(dto.email);
    const username = normalizeUsername(dto.username);
    await this.assertAccountAvailable(email, username);

    const otp = generateOtp();
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          role: Role.SISWA,
          isVerified: false,
          otpCode: this.hash(otp),
          otpExpiredAt: new Date(Date.now() + OTP_TTL_MS),
          otpPurpose: OtpPurpose.REGISTER,
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
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('Email atau username sudah digunakan!');
      }
      throw error;
    }

    const sent = await this.sendOtp(user.email, otp, OtpPurpose.REGISTER);
    if (!sent) {
      throw new ServiceUnavailableException(
        'Akun dibuat, tetapi email OTP gagal dikirim. Silakan gunakan kirim ulang OTP.',
      );
    }

    return {
      status: 'success',
      message: 'Kode OTP registrasi berhasil dikirim ke email',
    };
  }

  async registerPanitia(dto: RegisterPanitiaDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Konfirmasi password tidak cocok!');
    }

    const email = normalizeEmail(dto.email);
    const username = normalizeUsername(dto.username);
    await this.assertAccountAvailable(email, username);

    const otp = generateOtp();
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
            role: Role.PANITIA,
            isVerified: false,
            otpCode: this.hash(otp),
            otpExpiredAt: new Date(Date.now() + OTP_TTL_MS),
            otpPurpose: OtpPurpose.REGISTER,
            otpAttempts: 0,
          },
        });

        const sent = await this.sendOtp(user.email, otp, OtpPurpose.REGISTER);
        if (!sent) {
          throw new ServiceUnavailableException(
            'Akun panitia dibuat, tetapi email OTP gagal dikirim. Silakan gunakan kirim ulang OTP.',
          );
        }

        return {
          status: 'success',
          message: 'Registrasi panitia berhasil. Kode OTP dikirim ke email.',
          panitiaId,
        };
      } catch (error) {
        if (isUniqueViolation(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException('Gagal membuat ID panitia, silakan coba lagi.');
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(dto.email) },
    });

    if (!user || user.isVerified || user.otpPurpose !== OtpPurpose.REGISTER) {
      throw new BadRequestException(INVALID_OTP);
    }

    await this.assertOtp(user, dto.otpCode);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, ...this.clearedOtpData() },
    });

    return this.buildAuthResponse(
      user,
      'Registrasi dan verifikasi email berhasil',
    );
  }

  async resendOtp(dto: ResendOtpDto) {
    const genericResponse = {
      status: 'success',
      message:
        'Jika akun terdaftar dan belum diverifikasi, kode OTP baru telah dikirim ke email.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(dto.email) },
    });

    if (!user || user.isVerified || this.isOnCooldown(user)) {
      return genericResponse;
    }

    const otp = await this.issueOtp(user.id, OtpPurpose.REGISTER);
    await this.sendOtp(user.email, otp, OtpPurpose.REGISTER);

    return genericResponse;
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier.toLowerCase() }, { username: identifier }],
      },
    });

    const valid = await this.checkPassword(dto.password, user?.password);
    if (!user || !valid || user.role !== Role.SISWA) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Akun belum diverifikasi dengan OTP.');
    }

    return this.buildAuthResponse(user, 'Login berhasil');
  }

  async loginPanitia(dto: LoginPanitiaDto) {
    if (dto.panitiaId) {
      const user = await this.prisma.user.findUnique({
        where: { panitiaId: normalizePanitiaId(dto.panitiaId) },
      });

      const valid = await this.checkPassword(dto.password, user?.password);
      if (!user || !valid || user.role !== Role.PANITIA || !user.isVerified) {
        throw new UnauthorizedException(INVALID_CREDENTIALS);
      }

      return this.buildAuthResponse(user, 'Login panitia via ID berhasil');
    }

    if (dto.email) {
      const user = await this.prisma.user.findUnique({
        where: { email: normalizeEmail(dto.email) },
      });

      const valid = await this.checkPassword(dto.password, user?.password);
      if (
        !user ||
        !valid ||
        !user.isVerified ||
        (user.role !== Role.PANITIA && user.role !== Role.ADMIN)
      ) {
        throw new UnauthorizedException(INVALID_CREDENTIALS);
      }

      if (!dto.otpCode) {
        if (this.isOnCooldown(user)) {
          return {
            status: 'success',
            requiresOtp: true,
            message:
              'Kode OTP sebelumnya masih berlaku. Periksa email Anda atau tunggu satu menit untuk meminta ulang.',
          };
        }

        const otp = await this.issueOtp(user.id, OtpPurpose.LOGIN);
        const sent = await this.sendOtp(user.email, otp, OtpPurpose.LOGIN);
        if (!sent) {
          throw new ServiceUnavailableException(
            'Email OTP gagal dikirim. Silakan coba lagi.',
          );
        }

        return {
          status: 'success',
          requiresOtp: true,
          message: 'Kode OTP verifikasi login telah dikirim ke email.',
        };
      }

      if (user.otpPurpose !== OtpPurpose.LOGIN) {
        throw new BadRequestException(INVALID_OTP);
      }

      await this.assertOtp(user, dto.otpCode);

      await this.prisma.user.update({
        where: { id: user.id },
        data: this.clearedOtpData(),
      });

      return this.buildAuthResponse(user, 'Login via Email & OTP berhasil');
    }

    throw new BadRequestException('Harap masukkan ID Panitia atau Email.');
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const genericResponse = {
      status: 'success',
      message:
        'Jika akun terdaftar, kode OTP reset password telah dikirim ke email.',
    };

    let user: User | null = null;

    if (dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: normalizeEmail(dto.email) },
      });
    } else if (dto.username) {
      user = await this.prisma.user.findUnique({
        where: { username: normalizeUsername(dto.username) },
      });
    } else {
      throw new BadRequestException('Harap masukkan username atau email.');
    }

    if (!user || !user.isVerified || this.isOnCooldown(user)) {
      return genericResponse;
    }

    const otp = await this.issueOtp(user.id, OtpPurpose.RESET);
    await this.sendOtp(user.email, otp, OtpPurpose.RESET);

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Konfirmasi password tidak cocok!');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(dto.email) },
    });

    if (!user || user.otpPurpose !== OtpPurpose.RESET) {
      throw new BadRequestException(INVALID_OTP);
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
}
