import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccessTokenPayload } from '@event-reward-platform/core';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get(
        'JWT_ACCESS_SECRET_KEY',
        'your-secret-key',
      ),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  validate(
    req: Request,
    payload: AccessTokenPayload & { iat: number; exp: number },
  ): AccessTokenPayload {
    const { userId, role } = payload;
    const accessTokenPayload: AccessTokenPayload = { userId, role };

    req.user = accessTokenPayload;
    return accessTokenPayload;
  }
}
