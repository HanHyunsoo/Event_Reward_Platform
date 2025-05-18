import { Body, Controller } from '@nestjs/common';
import { EventsService } from './events.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateEventRequestDto,
  CreateEventResponseDto,
  EVENT_PATTERNS,
} from '@event-reward-platform/protocol';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @MessagePattern(EVENT_PATTERNS.HEALTH_CHECK)
  async healthCheck(): Promise<string> {
    return await Promise.resolve('OK');
  }

  @MessagePattern(EVENT_PATTERNS.CREATE_EVENT)
  async createEvent(
    @Payload() payload: CreateEventRequestDto,
  ): Promise<CreateEventResponseDto> {
    return await this.eventsService.createEvent(payload);
  }
}
