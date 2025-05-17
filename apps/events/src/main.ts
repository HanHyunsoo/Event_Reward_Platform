import { NestFactory } from '@nestjs/core';
import { EventsModule } from './events.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    EventsModule,
    {
      transport: Transport.TCP,
      options: { port: parseInt(process.env.EVENT_SERVICE_PORT ?? '3002') },
    },
  );
  await app.listen();
}
bootstrap();
