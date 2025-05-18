import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CreateEventRequestDto,
  CreateEventResponseDto,
  EVENT_PATTERNS,
  EventDto,
  FindAllEventRequestDto,
  FindOneEventResponseDto,
  Role,
} from '@event-reward-platform/protocol';
import { Request } from 'express';
import { AccessTokenPayload } from '@event-reward-platform/core';
import { JwtGuard } from '../auth/jwt.guard';
import { RoleGuard } from '../auth/role.guard';
import { Roles } from '../decorators/roles.decorator';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { FindAllEventResponseDto } from '@event-reward-platform/protocol/events/find-all-event-response.dto';
import { Types } from 'mongoose';

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

  private canAccessEvent(event: EventDto | undefined, role: Role): boolean {
    const isEventExist = event != null;

    if (!isEventExist) {
      return false;
    }

    if (event.isPublic) {
      return true;
    }

    return [Role.ADMIN, Role.OPERATOR].includes(role);
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  async getEventById(
    @Req() req: Request,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<FindOneEventResponseDto> {
    const resBody = await firstValueFrom<FindOneEventResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.GET_EVENT_BY_ID, id.toString()),
    );

    const requestUserRole = (req.user as AccessTokenPayload).role;

    if (!this.canAccessEvent(resBody?.event, requestUserRole)) {
      return {};
    }

    if ([Role.USER, Role.AUDITOR].includes(requestUserRole)) {
      if (resBody.event != null) {
        resBody.event.creatorId = undefined;
      }
    }

    return resBody;
  }

  @Get()
  @UseGuards(JwtGuard)
  async getEvents(
    @Req() req: Request,
    @Query() query: FindAllEventRequestDto,
  ): Promise<FindAllEventResponseDto> {
    const requestUserRole = (req.user as AccessTokenPayload).role;
    const isUserOrAuditor = [Role.USER, Role.AUDITOR].includes(requestUserRole);

    if (isUserOrAuditor) {
      query.isPublic = true;
    }

    const resBody = await firstValueFrom<FindAllEventResponseDto>(
      this.eventClient.send(EVENT_PATTERNS.GET_EVENTS, query),
    );

    return {
      events: resBody.events
        .filter((event) => {
          return this.canAccessEvent(event, requestUserRole);
        })
        .map((event) => {
          if (isUserOrAuditor) {
            event.creatorId = undefined;
          }

          return event;
        }),
    };
  }
}
