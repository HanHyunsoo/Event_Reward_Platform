import { Controller } from '@nestjs/common';
import { EventsService } from './events.service';
import { MessagePattern } from '@nestjs/microservices';
import { EVENT_PATTERNS } from '@event-reward-platform/protocol';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @MessagePattern(EVENT_PATTERNS.HEALTH_CHECK)
  async healthCheck(): Promise<string> {
    return await Promise.resolve('OKE');
  }
}
