import { Body, Controller } from '@nestjs/common';
import { EventsService } from './services/events.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  ClaimEventRewardResponse,
  ClaimEventRewardsRequestDto,
  CreateEventRequestDto,
  CreateEventResponseDto,
  EVENT_PATTERNS,
  FindAllEventRequestDto,
  FindAllEventResponseDto,
  FindOneEventResponseDto,
  GetClaimHistoriesRequestDto,
  GetClaimHistoriesResponseDto,
  GetEventRewardsResponse,
  UpdateEventRewardsRequestDto,
  UpdateEventRewardsResponseDto,
} from '@event-reward-platform/protocol';
import { ClaimHistoriesService } from './services/claim-histories.service';

@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly claimHistoriesService: ClaimHistoriesService,
  ) {}

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

  @MessagePattern(EVENT_PATTERNS.GET_REWARDS)
  async getEventRewards(
    @Payload() payload: string,
  ): Promise<GetEventRewardsResponse> {
    return await this.eventsService.getEventRewards(payload);
  }

  @MessagePattern(EVENT_PATTERNS.UPDATE_REWARDS)
  async updateEventRewards(
    @Payload() payload: UpdateEventRewardsRequestDto,
  ): Promise<UpdateEventRewardsResponseDto> {
    return await this.eventsService.updateEventRewards(payload);
  }

  @MessagePattern(EVENT_PATTERNS.CLAIM_REWARD)
  async claimEventRewards(
    @Payload() payload: ClaimEventRewardsRequestDto,
  ): Promise<ClaimEventRewardResponse> {
    return await this.claimHistoriesService.claimEventRewards(payload);
  }

  @MessagePattern(EVENT_PATTERNS.GET_CLAIM_HISTORIES)
  async getClaimHistories(
    @Payload() payload: GetClaimHistoriesRequestDto,
  ): Promise<GetClaimHistoriesResponseDto> {
    return await this.claimHistoriesService.getClaimHistories(payload);
  }
}
