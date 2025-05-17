import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@event-reward-platform/protocol';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(userId: string, role: Role): string {
    const accessToken = this.jwtService.sign(
      { userId, role },
      { expiresIn: '5m' },
    );

    return accessToken;
  }

  generateRefreshToken(userId: string): string {
    const refreshToken = this.jwtService.sign(
      { userId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET_KEY'),
        expiresIn: '7d',
      },
    );

    return refreshToken;
  }
}
