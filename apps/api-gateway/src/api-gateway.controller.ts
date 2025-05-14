import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class ApiGatewayController {
  constructor(
    private readonly apiGatewayService: ApiGatewayService,
    @Inject('USERS_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  @Get('users/health')
  healthCheck() {
    return this.userClient.send('users.health', '');
  }

  @Get('users/:id')
  async getUser(@Param('id') id: number): Promise<number> {
    return await firstValueFrom(this.userClient.send('users.findOne', id));
  }
}
