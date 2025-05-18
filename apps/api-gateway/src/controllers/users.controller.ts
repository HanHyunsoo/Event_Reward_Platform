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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USERS_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'User-Service 서버의 상태를 확인합니다.',
  })
  @ApiOkResponse({ description: 'OK' })
  async healthCheck(): Promise<string> {
    return await firstValueFrom(
      this.userClient.send(USER_PATTERNS.HEALTH_CHECK, ''),
    );
  }

  @Post()
  @ApiOperation({
    summary: '사용자 생성',
    description: '사용자를 생성합니다.',
  })
  @ApiCreatedResponse({ description: '사용자 생성 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiConflictResponse({ description: '이미 존재하는 사용자' })
  @ApiResponse({
    headers: {
      Authorization: {
        description: 'Bearer {accessToken}',
        schema: { type: 'string' },
      },
      'Set-Cookie': {
        description:
          'refreshToken={refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800',
        schema: { type: 'string' },
      },
    },
  })
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
  @ApiOperation({
    summary: '사용자 로그인',
    description: `사용자를 로그인합니다.

- Docker 컨테이너 생성시 초기 유저(아이디: admin, 비밀번호: admin, 권한: ADMIN)가 생성됩니다.
`,
  })
  @ApiOkResponse({ description: '사용자 로그인 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiNotFoundResponse({ description: '존재하지 않는 사용자' })
  @ApiUnauthorizedResponse({
    description: '비밀번호가 일치하지 않습니다',
  })
  @ApiForbiddenResponse({ description: '유저가 정지되었습니다.' })
  @ApiResponse({
    headers: {
      Authorization: {
        description: 'Bearer {accessToken}',
        schema: { type: 'string' },
      },
      'Set-Cookie': {
        description:
          'refreshToken={refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800',
        schema: { type: 'string' },
      },
    },
  })
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
  @ApiOperation({
    summary: '토큰 갱신',
    description: '토큰을 갱신합니다.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: '토큰 갱신 성공' })
  @ApiUnauthorizedResponse({
    description:
      '토큰이 존재하지 않습니다. 또는 액세스 토큰과 리프레시 토큰의 유저 정보가 다릅니다.',
  })
  @ApiNotFoundResponse({ description: '유저가 존재하지 않습니다.' })
  @ApiForbiddenResponse({ description: '유저가 정지되었습니다.' })
  @ApiResponse({
    headers: {
      Authorization: {
        description: 'Bearer {accessToken}',
        schema: { type: 'string' },
      },
      'Set-Cookie': {
        description:
          'refreshToken={refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800',
        schema: { type: 'string' },
      },
    },
  })
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
  @ApiOperation({
    summary: '사용자 정보 수정(ADMIN 권한 필요)',
    description: '사용자 정보를 수정합니다.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: '사용자 정보 수정 성공' })
  @ApiBadRequestResponse({ description: '요청 형식 확인' })
  @ApiNotFoundResponse({ description: '존재하지 않는 사용자' })
  @ApiForbiddenResponse({ description: '권한이 없습니다.' })
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
