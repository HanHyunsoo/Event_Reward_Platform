import { Controller, Get } from '@nestjs/common';
import { ApiGatewayService } from '../api-gateway.service';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'API-Gateway 서버의 상태를 확인합니다.',
  })
  @ApiOkResponse({ description: 'OK' })
  healthCheck(): string {
    return 'OK';
  }
}
