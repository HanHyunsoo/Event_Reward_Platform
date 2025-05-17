import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role, TokenDto } from '@event-reward-platform/protocol';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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

  async refreshAccessToken(tokenDto: TokenDto): Promise<TokenDto> {
    const decodeRefreshToken = (refreshToken: string) => {
      try {
        return this.jwtService.verify<{ userId: string }>(refreshToken, {
          secret: this.configService.get('JWT_REFRESH_SECRET_KEY'),
        });
      } catch (error) {
        throw new RpcException(
          new UnauthorizedException((error as Error).message),
        );
      }
    };

    const decodedRefreshToken = decodeRefreshToken(tokenDto.refreshToken);

    const decodeAccessToken = (
      accessToken: string,
    ): { userId: string; role: Role } => {
      try {
        return this.jwtService.verify<{ userId: string; role: Role }>(
          accessToken,
        );
      } catch (error) {
        if (error instanceof TokenExpiredError) {
          return this.jwtService.decode<{ userId: string; role: Role }>(
            accessToken,
          );
        }

        throw new RpcException(
          new UnauthorizedException((error as Error).message),
        );
      }
    };

    const decodedExpiredAccessToken = decodeAccessToken(tokenDto.accessToken);

    if (decodedExpiredAccessToken.userId !== decodedRefreshToken.userId) {
      throw new RpcException(
        new UnauthorizedException(
          '액세스 토큰과 리프레시 토큰의 유저 아이디가 다릅니다.',
        ),
      );
    }

    const user = await this.userModel.findOne(
      {
        userId: decodedExpiredAccessToken.userId,
      },
      {
        userId: 1,
        role: 1,
        bannedUntil: 1,
      },
    );

    if (user == null) {
      throw new RpcException(
        new NotFoundException('유저가 존재하지 않습니다.'),
      );
    }

    if (user.bannedUntil.getTime() > Date.now()) {
      throw new RpcException(
        new UnauthorizedException(
          `유저가 정지되었습니다.(정지 종료 시간: ${user.bannedUntil.toISOString()})`,
        ),
      );
    }

    const newAccessToken = this.generateAccessToken(user.userId, user.role);
    const newRefreshToken = this.generateRefreshToken(user.userId);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
