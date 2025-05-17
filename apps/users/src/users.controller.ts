import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TokenDto, USER_PATTERNS } from '@event-reward-platform/protocol';
import { CreateUserRequestDto } from '@event-reward-platform/protocol/users/create-user-request.dto';
import { AuthService } from './services/auth.service';
import { UsersService } from './services/users.service';

@Controller()
export class UsersController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @MessagePattern(USER_PATTERNS.HEALTH_CHECK)
  async healthCheck(): Promise<string> {
    return await Promise.resolve('OK');
  }

  @MessagePattern(USER_PATTERNS.CREATE_USER)
  async createUser(
    @Payload() payload: CreateUserRequestDto,
  ): Promise<TokenDto> {
    const { userId, role } = await this.usersService.signUp(payload);

    const accessToken = this.authService.generateAccessToken(userId, role);
    const refreshToken = this.authService.generateRefreshToken(userId);

    return { accessToken, refreshToken };
  }
}
