import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private config;
    private transporter;
    constructor(config: ConfigService);
    sendOtpEmail(email: string, otp: string): Promise<void>;
    sendForgotPasswordOtp(email: string, otp: string): Promise<void>;
}
