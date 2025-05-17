import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateOrLoginUserRequestDto,
  TokenDto,
  USER_PATTERNS,
} from '@event-reward-platform/protocol';
import { Response } from 'express';

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
}
