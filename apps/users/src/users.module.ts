import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { ConfigService } from './services/config/config.service';

@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersService, ConfigService],
})
export class UsersModule {}
