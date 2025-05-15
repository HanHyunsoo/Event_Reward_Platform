import { Controller } from '@nestjs/common';
import { EventsService } from './events.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @MessagePattern('events.health')
  async healthCheck(): Promise<string> {
    return await Promise.resolve('OKE');
  }
}
