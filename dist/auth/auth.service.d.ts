import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
export declare class AuthService implements OnModuleInit {
    private prisma;
    private jwt;
    private mailService;
    private readonly logger;
    private readonly otpSecret;
    private readonly dummyHash;
    constructor(prisma: PrismaService, jwt: JwtService, mailService: MailService, config: ConfigService);
    private readonly adminEmail;
    private readonly adminPassword;
    onModuleInit(): Promise<void>;
    private hash;
    private isOnCooldown;
    private clearedOtpData;
    private issueOtp;
    private assertOtp;
    private sendOtp;
    private checkPassword;
    private buildAuthResponse;
    private assertAccountAvailable;
    private nextPanitiaId;
    registerSiswa(dto: RegisterSiswaDto): Promise<{
        status: string;
        message: string;
    }>;
    registerPanitia(dto: RegisterPanitiaDto): Promise<{
        status: string;
        message: string;
        panitiaId: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        status: string;
        message: string;
        access_token: string;
        token_type: string;
        data: {
            id: string;
            username: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            panitiaId: string;
        };
    }>;
    resendOtp(dto: ResendOtpDto): Promise<{
        status: string;
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        status: string;
        message: string;
        access_token: string;
        token_type: string;
        data: {
            id: string;
            username: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            panitiaId: string;
        };
    }>;
    loginPanitia(dto: LoginPanitiaDto): Promise<{
        status: string;
        message: string;
        access_token: string;
        token_type: string;
        data: {
            id: string;
            username: string;
            email: string;
            role: import(".prisma/client").$Enums.Role;
            panitiaId: string;
        };
    } | {
        status: string;
        requiresOtp: boolean;
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        status: string;
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        status: string;
        message: string;
    }>;
}
