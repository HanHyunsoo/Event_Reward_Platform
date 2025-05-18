import { Body, Controller } from '@nestjs/common';
import { EventsService } from './events.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateEventRequestDto,
  CreateEventResponseDto,
  EVENT_PATTERNS,
  FindAllEventRequestDto,
  FindOneEventResponseDto,
} from '@event-reward-platform/protocol';
import { FindAllEventResponseDto } from '@event-reward-platform/protocol/events/find-all-event-response.dto';

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

  @MessagePattern(EVENT_PATTERNS.GET_EVENT_BY_ID)
  async getEventById(
    @Payload() payload: string,
  ): Promise<FindOneEventResponseDto> {
    return await this.eventsService.getEventById(payload);
  }

  @MessagePattern(EVENT_PATTERNS.GET_EVENTS)
  async findAllEvents(
    @Payload() payload: FindAllEventRequestDto,
  ): Promise<FindAllEventResponseDto> {
    return await this.eventsService.findAllEvents(payload);
  }
}
