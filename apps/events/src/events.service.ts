import { Injectable } from '@nestjs/common';
import { EventDocument } from './schemas/event.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Event } from './schemas/event.schema';
import {
  CreateEventRequestDto,
  CreateEventResponseDto,
} from '@event-reward-platform/protocol';

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
    const rewards = requestEvent.rewards;

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
}
