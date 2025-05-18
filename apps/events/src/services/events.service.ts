import { Injectable, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';

import {
  CreateEventRequestDto,
  CreateEventResponseDto,
  FindAllEventRequestDto,
  FindAllEventResponseDto,
  FindOneEventResponseDto,
  GetEventRewardsResponse,
  UpdateEventRewardsRequestDto,
  UpdateEventRewardsResponseDto,
} from '@event-reward-platform/protocol';

import { Event, EventDocument } from '../schemas/event.schema';
import {
  convertRewardDtoToReward,
  convertRewardToDto,
} from '../utils/dto.util';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  async createEvent(
    createEventRequestDto: CreateEventRequestDto,
  ): Promise<CreateEventResponseDto> {
    const requestEvent = createEventRequestDto.event;

    const challenge = requestEvent.challenge;

    const rewards = requestEvent.rewards.map((reward) =>
      convertRewardDtoToReward(reward),
    );

    const insertedEvent = await this.eventModel.create({
      startTime: new Date(requestEvent.startTime),
      endTime: new Date(requestEvent.endTime),
      isPublic: requestEvent.isPublic,
      challenge,
      rewards,
      rewardLimit: requestEvent.rewardLimit,
      creatorId: requestEvent.creatorId,
    });

    return {
      event: {
        _id: (insertedEvent._id as mongoose.Types.ObjectId).toString(),
        startTime: insertedEvent.startTime,
        endTime: insertedEvent.endTime,
        isPublic: insertedEvent.isPublic,
        challenge: insertedEvent.challenge,
        rewards: insertedEvent.rewards,
        rewardLimit: insertedEvent.rewardLimit,
      },
    };
  }

  async getEventById(eventId: string): Promise<FindOneEventResponseDto> {
    const event = await this.eventModel.findById(eventId);

    if (!event) {
      return {};
    }

    return {
      event: {
        _id: (event._id as mongoose.Types.ObjectId).toString(),
        startTime: event.startTime,
        endTime: event.endTime,
        isPublic: event.isPublic,
        challenge: event.challenge,
        rewards: event.rewards.map((event) => convertRewardToDto(event)),
        rewardLimit: event.rewardLimit,
        creatorId: event.creatorId,
      },
    };
  }

  async findAllEvents(
    findAllEventRequestDto: FindAllEventRequestDto,
  ): Promise<FindAllEventResponseDto> {
    const { startDate, isPublic, count } = findAllEventRequestDto;

    const events = await this.eventModel
      .find({
        startTime: { $gte: startDate },
        isPublic: isPublic,
      })
      .sort({ startTime: 1 })
      .limit(count);

    return {
      events: events.map((event) => ({
        _id: (event._id as mongoose.Types.ObjectId).toString(),
        startTime: event.startTime,
        endTime: event.endTime,
        isPublic: event.isPublic,
        challenge: event.challenge,
        rewards: event.rewards.map((event) => convertRewardToDto(event)),
        rewardLimit: event.rewardLimit,
        creatorId: event.creatorId,
      })),
    };
  }

  async getEventRewards(eventId: string): Promise<GetEventRewardsResponse> {
    const event = await this.eventModel.findById(eventId);

    if (event == null) {
      throw new RpcException(new NotFoundException('이벤트 찾을 수 없음'));
    }

    return {
      rewards: event.rewards.map((event) => convertRewardToDto(event)),
    };
  }

  async updateEventRewards(
    updateEventRewardsRequestDto: UpdateEventRewardsRequestDto,
  ): Promise<UpdateEventRewardsResponseDto> {
    const { eventId, rewards } = updateEventRewardsRequestDto;

    const event = await this.eventModel.findById(eventId);

    if (event == null) {
      throw new RpcException(new NotFoundException('이벤트 찾을 수 없음'));
    }

    event.rewards = rewards.map((reward) => convertRewardDtoToReward(reward));
    await event.save();

    return {
      rewards: event.rewards.map((event) => convertRewardToDto(event)),
    };
  }
}
