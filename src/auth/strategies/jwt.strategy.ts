import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET wajib diisi minimal 32 karakter');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: string;
    iat?: number;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        panitiaId: true,
        role: true,
        isVerified: true,
        aktif: true,
        passwordChangedAt: true,
      },
    });

    if (!user || !user.isVerified || !user.aktif) {
      throw new UnauthorizedException('Akses ditolak, token tidak valid.');
    }

    if (
      user.passwordChangedAt &&
      payload.iat !== undefined &&
      payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      throw new UnauthorizedException('Sesi berakhir. Silakan login kembali.');
    }

    const { passwordChangedAt, ...pengguna } = user;
    void passwordChangedAt;
    return pengguna;
  }
}