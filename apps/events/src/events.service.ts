import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventDocument } from './schemas/event.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Event } from './schemas/event.schema';
import {
  CreateEventRequestDto,
  CreateEventResponseDto,
  FindAllEventRequestDto,
  FindOneEventResponseDto,
  InventoryItemType,
  RewardDto,
  RewardType,
  WeaponId,
  ArmorId,
  ConsumableId,
  ItemInfoDto,
} from '@event-reward-platform/protocol';
import { FindAllEventResponseDto } from '@event-reward-platform/protocol/events/find-all-event-response.dto';
import {
  CashReward,
  CoinReward,
  CouponReward,
  ItemReward,
  Reward,
} from './schemas/reward.subschema';
import { RpcException } from '@nestjs/microservices';
import { GetEventRewardsResponse } from '@event-reward-platform/protocol/events/get-event-rewards-response';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
  ) {}

  private convertRewardToDto(reward: Reward): RewardDto {
    switch (reward.rewardType) {
      case RewardType.ITEM: {
        const itemReward = reward as ItemReward;

        const itemInfo: ItemInfoDto = {
          type: itemReward.itemType,
        };
        if (itemReward.itemType === InventoryItemType.WEAPON) {
          itemInfo.weaponId = itemReward.itemId as WeaponId;
        } else if (itemReward.itemType === InventoryItemType.ARMOR) {
          itemInfo.armorId = itemReward.itemId as ArmorId;
        } else if (itemReward.itemType === InventoryItemType.CONSUMABLE) {
          itemInfo.consumableId = itemReward.itemId as ConsumableId;
        }
        return {
          rewardType: reward.rewardType,
          itemInfo,
          quantity: reward.quantity,
        } as RewardDto;
      }
      case RewardType.COUPON: {
        const couponReward = reward as CouponReward;

        return {
          rewardType: couponReward.rewardType,
          couponId: couponReward.couponId,
          quantity: couponReward.quantity,
        } as RewardDto;
      }
      case RewardType.CASH: {
        const cashReward = reward as CashReward;

        return {
          rewardType: cashReward.rewardType,
          quantity: cashReward.quantity,
        } as RewardDto;
      }
      case RewardType.COIN: {
        const coinReward = reward as CoinReward;

        return {
          rewardType: coinReward.rewardType,
          quantity: coinReward.quantity,
        } as RewardDto;
      }
      default:
        return {
          rewardType: reward.rewardType,
          quantity: reward.quantity,
        } as RewardDto;
    }
  }

  private convertRewardDtoToReward(rewardDto: RewardDto): Reward {
    if (rewardDto.rewardType === RewardType.ITEM) {
      return {
        rewardType: rewardDto.rewardType,
        itemType: rewardDto?.itemInfo?.type,
        itemId:
          rewardDto?.itemInfo?.weaponId ??
          rewardDto?.itemInfo?.armorId ??
          rewardDto?.itemInfo?.consumableId,
        quantity: rewardDto.quantity,
      } as ItemReward;
    }

    if (rewardDto.rewardType === RewardType.COUPON) {
      return {
        rewardType: rewardDto.rewardType,
        couponId: rewardDto.couponId,
        quantity: rewardDto.quantity,
      } as CouponReward;
    }

    if (rewardDto.rewardType === RewardType.CASH) {
      return {
        rewardType: rewardDto.rewardType,
        quantity: rewardDto.quantity,
      } as CashReward;
    }

    if (rewardDto.rewardType === RewardType.COIN) {
      return {
        rewardType: rewardDto.rewardType,
        quantity: rewardDto.quantity,
      } as CoinReward;
    }

    throw new RpcException(new BadRequestException('Invalid reward type'));
  }

  async createEvent(
    createEventRequestDto: CreateEventRequestDto,
  ): Promise<CreateEventResponseDto> {
    const requestEvent = createEventRequestDto.event;

    const challenge = requestEvent.challenge;

    const rewards = requestEvent.rewards.map((reward) =>
      this.convertRewardDtoToReward(reward),
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
        rewards: event.rewards.map((event) => this.convertRewardToDto(event)),
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
        rewards: event.rewards.map((event) => this.convertRewardToDto(event)),
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
      rewards: event.rewards.map((event) => this.convertRewardToDto(event)),
    };
  }
}
