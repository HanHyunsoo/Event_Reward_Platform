import { Injectable } from '@nestjs/common';
import { EventDocument } from './schemas/event.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Event } from './schemas/event.schema';
import {
  CreateEventRequestDto,
  CreateEventResponseDto,
  FindAllEventRequestDto,
  FindOneEventResponseDto,
  RewardType,
} from '@event-reward-platform/protocol';
import { FindAllEventResponseDto } from '@event-reward-platform/protocol/events/find-all-event-response.dto';

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
    const rewards = requestEvent.rewards.map((reward) => {
      if (reward.rewardType !== RewardType.ITEM && reward.itemInfo != null) {
        return {
          rewardType: RewardType.ITEM,
          quantity: reward.quantity,
        };
      }
      return reward;
    });

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
        rewards: event.rewards,
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
      .sort({ startTime: -1 })
      .limit(count);

    return {
      events: events.map((event) => ({
        _id: (event._id as mongoose.Types.ObjectId).toString(),
        startTime: event.startTime,
        endTime: event.endTime,
        isPublic: event.isPublic,
        challenge: event.challenge,
        rewards: event.rewards,
        rewardLimit: event.rewardLimit,
        creatorId: event.creatorId,
      })),
    };
  }
}
