import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { USER_PATTERNS } from '@event-reward-platform/protocol';
@Controller()
export class UsersController {
  constructor() {}

  @MessagePattern(USER_PATTERNS.HEALTH_CHECK)
  async healthCheck(): Promise<string> {
    return await Promise.resolve('OKU');
  }
}
