import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UsersController {
  constructor() {}

  @MessagePattern('users.health')
  async healthCheck(): Promise<string> {
    return await Promise.resolve('OKU');
  }
}
