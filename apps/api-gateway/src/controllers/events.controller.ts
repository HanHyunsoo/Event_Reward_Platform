import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateEventRequestDto,
  CreateEventResponseDto,
  EVENT_PATTERNS,
  Role,
} from '@event-reward-platform/protocol';
import { Request } from 'express';
import { AccessTokenPayload } from '@event-reward-platform/core';
import { JwtGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('events')
export class EventsController {
  constructor(
    @Inject('EVENTS_SERVICE') private readonly eventClient: ClientProxy,
  ) {}

  @Get('health')
  async healthCheck(): Promise<string> {
    return await firstValueFrom(
      this.eventClient.send(EVENT_PATTERNS.HEALTH_CHECK, ''),
    );
  }

  @Post()
  @UseGuards(JwtGuard, RoleGuard)
  @Roles(Role.ADMIN, Role.OPERATOR)
  async createEvent(
    @Req() req: Request,
    @Body() createEventRequestDto: CreateEventRequestDto,
  ): Promise<CreateEventResponseDto> {
    const { event } = createEventRequestDto;
    const eventWithCreatorId = {
      ...event,
      creatorId: (req.user as AccessTokenPayload).userId,
    };

    return await firstValueFrom<CreateEventResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.CREATE_EVENT, {
        event: eventWithCreatorId,
      } as CreateEventRequestDto),
    );
  }
}
