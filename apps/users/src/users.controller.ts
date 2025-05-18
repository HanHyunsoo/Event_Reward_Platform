import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  FindOneUserResponseDto,
  GiveRewardsRequestDto,
  TokenDto,
  USER_PATTERNS,
  UserDto,
} from '@event-reward-platform/protocol';
import { CreateOrLoginUserRequestDto } from '@event-reward-platform/protocol/users/create-or-login-user-request.dto';
import { AuthService } from './services/auth.service';
import { GiveRewardsResponse } from '@event-reward-platform/protocol/users/give-rewards-response.dto';
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
    @Payload() payload: CreateOrLoginUserRequestDto,
  ): Promise<TokenDto> {
    const { userId, role } = await this.usersService.create(payload);

    const accessToken = this.authService.generateAccessToken(userId, role);
    const refreshToken = this.authService.generateRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  @MessagePattern(USER_PATTERNS.LOGIN)
  async loginUser(
    @Payload() payload: CreateOrLoginUserRequestDto,
  ): Promise<TokenDto> {
    const { userId, role } = await this.usersService.login(payload);

    const accessToken = this.authService.generateAccessToken(userId, role);
    const refreshToken = this.authService.generateRefreshToken(userId);

    return { accessToken, refreshToken };
  }

  @MessagePattern(USER_PATTERNS.REFRESH_TOKEN)
  async refreshToken(@Payload() payload: TokenDto): Promise<TokenDto> {
    return await this.authService.refreshAccessToken(payload);
  }

  @MessagePattern(USER_PATTERNS.UPDATE_USER)
  async updateUser(@Payload() payload: UserDto): Promise<UserDto> {
    return await this.usersService.updateUser(payload);
  }

  @MessagePattern(USER_PATTERNS.GET_USER_INFO)
  async getUserInfo(
    @Payload() payload: string,
  ): Promise<FindOneUserResponseDto> {
    return await this.usersService.getUserInfoWithValidation(payload);
  }

  @MessagePattern(USER_PATTERNS.GIVE_REWARDS)
  async giveRewards(
    @Payload() payload: GiveRewardsRequestDto,
  ): Promise<GiveRewardsResponse> {
    return await this.usersService.giveRewards(payload);
  }
}
