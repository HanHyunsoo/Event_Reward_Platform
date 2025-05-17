import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateOrLoginUserRequestDto,
  Role,
  TokenDto,
  USER_PATTERNS,
  UpdateUserRequestDto,
  UpdateUserResponseDto,
  UserDto,
} from '@event-reward-platform/protocol';
import { Request, Response } from 'express';
import { RoleGuard } from '../auth/role.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  @Get('health')
  async healthCheck(): Promise<string> {
    return await firstValueFrom(
      this.userClient.send(USER_PATTERNS.HEALTH_CHECK, ''),
    );
  }

  @Post()
  async createUser(
    @Body() body: CreateOrLoginUserRequestDto,
    @Res() res: Response,
  ): Promise<Response> {
    const { accessToken, refreshToken } = await firstValueFrom<TokenDto>(
      this.userClient.send(USER_PATTERNS.CREATE_USER, body),
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.setHeader('Authorization', `Bearer ${accessToken}`);

    return res.status(HttpStatus.CREATED).send();
  }

  @Post('login')
  async loginUser(
    @Body() body: CreateOrLoginUserRequestDto,
    @Res() res: Response,
  ): Promise<Response> {
    const { accessToken, refreshToken } = await firstValueFrom<TokenDto>(
      this.userClient.send(USER_PATTERNS.LOGIN, body),
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.setHeader('Authorization', `Bearer ${accessToken}`);

    return res.status(HttpStatus.OK).send();
  }

  @Post('refresh-token')
  async refreshToken(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const tokenDto: TokenDto = {
      accessToken: req.headers.authorization?.split(' ')[1] ?? '',
      refreshToken: (req.cookies as Record<string, string>).refreshToken ?? '',
    };

    if (tokenDto.accessToken === '' || tokenDto.refreshToken === '') {
      throw new UnauthorizedException('토큰이 존재하지 않습니다.');
    }

    const newTokenDto = await firstValueFrom<TokenDto>(
      this.userClient.send(USER_PATTERNS.REFRESH_TOKEN, tokenDto),
    );

    res.cookie('refreshToken', newTokenDto.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.setHeader('Authorization', `Bearer ${newTokenDto.accessToken}`);

    return res.status(HttpStatus.OK).send();
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(Role.ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserRequestDto,
  ): Promise<UpdateUserResponseDto> {
    const userDto: UserDto = {
      userId: id,
      role: body.role,
    };

    const user = await firstValueFrom<UserDto>(
      this.userClient.send(USER_PATTERNS.UPDATE_USER, userDto),
    );

    return { user };
  }
}
