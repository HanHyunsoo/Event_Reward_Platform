import { NestFactory } from '@nestjs/core';
import { ApiGatewayModule } from './api-gateway.module';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  app.use(cookieParser());

  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('API_GATEWAY_PORT', '3000'));

  await app.listen(port);
}
bootstrap();
