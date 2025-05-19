import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './services/events.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { MicroServiceExceptionFilter } from '@event-reward-platform/core';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schemas/event.schema';
import { ClaimHistory } from './schemas/claim-history.schema';
import { ClaimHistorySchema } from './schemas/claim-history.schema';
import { ClaimHistoriesService } from './services/claim-histories.service';
import { Lock, LockSchema } from './schemas/lock.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    ClientsModule.registerAsync([
      {
        name: 'USERS_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('USER_SERVICE_HOST', 'localhost'),
            port: configService.get('USER_SERVICE_PORT', 3001),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('EVENT_SERVICE_MONGO_URL'),
      }),
    }),
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: ClaimHistory.name, schema: ClaimHistorySchema },
      { name: Lock.name, schema: LockSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    ClaimHistoriesService,
    {
      provide: APP_FILTER,
      useClass: MicroServiceExceptionFilter,
    },
  ],
})
export class EventsModule {}
