import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UsersModule } from './users.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(UsersModule);
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('USER_SERVICE_PORT') || '3001');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { port },
  });

  await app.startAllMicroservices();
}
bootstrap();
