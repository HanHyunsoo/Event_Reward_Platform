import { Controller } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('users.health')
  healthCheck(): string {
    return 'OK';
  }

  @MessagePattern('users.findOne')
  findOne(data: number) {
    return data;
  }
}
