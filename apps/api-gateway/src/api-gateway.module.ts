import { Module, ValidationPipe } from '@nestjs/common';
import { ApiGatewayController } from './controllers/api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './controllers/users.controller';
import { EventsController } from './controllers/events.controller';
import { GatewayExceptionFilter } from './filters/gateway-exception.filter';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtStrategy } from './auth/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

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
            port: configService.get('USER_SERVICE_PORT', 3001),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'EVENTS_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            port: configService.get('EVENT_SERVICE_PORT', 3002),
          },
        }),
        inject: [ConfigService],
      },
    ]),
    PassportModule,
  ],
  controllers: [ApiGatewayController, UsersController, EventsController],
  providers: [
    ApiGatewayService,
    {
      provide: APP_FILTER,
      useClass: GatewayExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          whitelist: true,
        }),
    },
    JwtStrategy,
  ],
})
export class ApiGatewayModule {}
