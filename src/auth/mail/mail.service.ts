import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: Number(this.config.get<string>('MAIL_PORT') ?? 587),
      secure: false,
      requireTLS: true,
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  // 1. Pengiriman OTP Registrasi (Format Text Polos seperti Mail::raw Laravel)
  async sendOtpEmail(email: string, otp: string) {
    const messageContent =
      `Berikut adalah kode OTP Anda untuk verifikasi akun Anda di SMK TI Bali Global:\n\n` +
      `Kode OTP: ${otp}\n\n` +
      `Kode OTP ini bersifat rahasia dan hanya dapat digunakan satu kali. Demi keamanan akun Anda, jangan membagikan kode OTP ini kepada siapa pun.\n\n` +
      `Hormat kami,\n` +
      `SMK TI Bali Global`;

    const mailOptions = {
      from: `"${this.config.get<string>('MAIL_FROM_NAME')}" <${this.config.get<string>('MAIL_FROM_ADDRESS')}>`,
      to: email,
      subject: 'Kode OTP Verifikasi Registrasi - SMK TI Bali Global',
      text: messageContent,
    };

    await this.transporter.sendMail(mailOptions);
  }

  // 2. Pengiriman OTP Reset Password (Format Text Polos)
  async sendForgotPasswordOtp(email: string, otp: string) {
    const messageContent =
      `Berikut adalah kode OTP Anda untuk reset password di SMK TI Bali Global:\n\n` +
      `Kode OTP: ${otp}\n\n` +
      `Kode OTP ini bersifat rahasia. Demi keamanan akun Anda, jangan membagikan kode OTP ini kepada siapa pun.\n\n` +
      `Hormat kami,\n` +
      `SMK TI Bali Global`;

    const mailOptions = {
      from: `"${this.config.get<string>('MAIL_FROM_NAME')}" <${this.config.get<string>('MAIL_FROM_ADDRESS')}>`,
      to: email,
      subject: 'Kode OTP Reset Password - SMK TI Bali Global',
      text: messageContent,
    };

    await this.transporter.sendMail(mailOptions);
  }
}