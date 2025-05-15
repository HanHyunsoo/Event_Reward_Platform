import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USER_PATTERNS } from '@event-reward-platform/protocol';

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
}
