import { NestFactory } from '@nestjs/core';
import { EventsModule } from './events.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(EventsModule);
  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('EVENT_SERVICE_PORT', '3002'));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { port },
  });

  await app.startAllMicroservices();
}
bootstrap();
