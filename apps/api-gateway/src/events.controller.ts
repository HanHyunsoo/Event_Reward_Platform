import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('events')
export class EventsController {
  constructor(
    @Inject('EVENTS_SERVICE') private readonly eventClient: ClientProxy,
  ) {}

  @Get('health')
  async healthCheck(): Promise<string> {
    return await firstValueFrom(this.eventClient.send('events.health', ''));
  }
}
