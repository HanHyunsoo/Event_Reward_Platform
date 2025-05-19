import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { ClaimHistoryDocument } from '../schemas/claim-history.schema';
import { ClaimHistory } from '../schemas/claim-history.schema';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
  ClaimEventRewardsRequestDto,
  ClaimEventRewardResponseDto,
  USER_PATTERNS,
  FindOneUserResponseDto,
  ClaimStatus,
  GiveRewardsResponse,
  ChallengeType,
  AllUserDto,
  GetClaimHistoriesResponseDto,
  GetClaimHistoriesRequestDto,
  ClaimHistoryFilter,
} from '@event-reward-platform/protocol';
import { firstValueFrom } from 'rxjs';
import { EventDocument } from '../schemas/event.schema';
import { convertRewardToDto } from '../utils/dto.util';
import {
  AllItemCount,
  CashGreaterThanOrEqual,
  Challenge,
  CoinGreaterThanOrEqual,
  ContinuousLoginCount,
  ReturnUser,
  SpecificItemCount,
} from '../schemas/challenge.subschema';
import { Lock, LockDocument } from '../schemas/lock.schema';

@Injectable()
export class ClaimHistoriesService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(ClaimHistory.name)
    private claimHistoryModel: Model<ClaimHistoryDocument>,
    @InjectModel(Lock.name) private lockModel: Model<LockDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject('USERS_SERVICE') private readonly userClient: ClientProxy,
  ) {}

  async claimEventRewards(
    claimEventRewardsRequestDto: ClaimEventRewardsRequestDto,
  ): Promise<ClaimEventRewardResponseDto> {
    const { eventId, userId } = claimEventRewardsRequestDto;

    const session = await this.connection.startSession();
    session.startTransaction();

    let lock: LockDocument | null = null;

    try {
      lock = await this.lockModel.create({ key: `${eventId}:${userId}` });

      const event = await this.eventModel.findById(eventId, null, {
        session,
      });

      if (event == null || !event.isPublic) {
        throw new NotFoundException('이벤트를 찾을 수 없습니다.');
      }

      if (event.endTime.getTime() < Date.now()) {
        throw new ForbiddenException('이벤트가 종료되었습니다.');
      }

      if (event.rewardLimit != null && event.rewardLimit === 0) {
        throw new GoneException('이벤트 보상 지급이 모두 소진되었습니다.');
      }

      const isClaimed =
        (await this.claimHistoryModel.findOne(
          {
            eventId,
            userId,
            status: ClaimStatus.CLAIMED,
          },
          { _id: 1 },
          { session },
        )) != null;

      if (isClaimed) {
        throw new ConflictException('이미 보상을 지급받았습니다.');
      }

      const { user } = await firstValueFrom<FindOneUserResponseDto>(
        this.userClient.send(USER_PATTERNS.GET_USER_INFO, userId),
      );

      if (!this.checkChallenge(user, event.challenge)) {
        throw new ForbiddenException('도전 과제를 달성하지 못했습니다.');
      }

      if (event.rewardLimit != null) {
        const updatedEvent = await this.eventModel.findOneAndUpdate(
          { _id: eventId },
          { $inc: { rewardLimit: -1 } },
          {
            session,
            new: true,
            projection: { rewardLimit: 1 },
          },
        );

        if (updatedEvent && updatedEvent.rewardLimit < 0) {
          throw new GoneException('이벤트 보상 지급이 모두 소진되었습니다.');
        }
      }
      await session.commitTransaction();

      await this.claimHistoryModel.create({
        eventId,
        userId,
        status: ClaimStatus.CLAIMED,
      });
      const { user: updatedUser } = await firstValueFrom<GiveRewardsResponse>(
        this.userClient.send(USER_PATTERNS.GIVE_REWARDS, {
          userId,
          rewards: event.rewards.map((reward) => convertRewardToDto(reward)),
        }),
      );

      return {
        user: updatedUser,
      };
    } catch (error) {
      let failureCause = 'Unknown error';
      let throwError: Error = error as Error;

      if (error instanceof Error && 'code' in error && error?.code === 11000) {
        failureCause = '다른 요청에서 보상을 받고 있습니다';
        throwError = new ConflictException(failureCause);
        throwError.stack = error.stack;
      } else {
        failureCause = error instanceof Error ? error.message : String(error);
      }

      await session.abortTransaction();
      await this.claimHistoryModel.create({
        eventId,
        userId,
        status: ClaimStatus.CLAIM_FAILED,
        failureCause,
      });

      throw new RpcException(throwError);
    } finally {
      await session.endSession();
      if (lock != null) {
        await lock.deleteOne();
      }
    }
  }

  checkChallenge(user: AllUserDto, challenge?: Challenge): boolean {
    if (challenge == null) {
      return true;
    }

    switch (challenge.type) {
      case ChallengeType.누적_로그인_횟수:
        return (
          user.consecutiveLogin.count >=
          (challenge as ContinuousLoginCount).loginCount
        );
      case ChallengeType.복귀_유저: {
        const daysSinceLastLoginCount = Math.floor(
          (Date.now() - new Date(user.lastLoginAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return (
          daysSinceLastLoginCount >=
          (challenge as ReturnUser).daysSinceLastLogin
        );
      }
      case ChallengeType.캐시_소유_이상:
        return user.cash >= (challenge as CashGreaterThanOrEqual).cash;
      case ChallengeType.캐시_소유_이하:
        return user.cash <= (challenge as CashGreaterThanOrEqual).cash;
      case ChallengeType.코인_소유_이상:
        return user.coins >= (challenge as CoinGreaterThanOrEqual).coin;
      case ChallengeType.코인_소유_이하:
        return user.coins <= (challenge as CoinGreaterThanOrEqual).coin;
      case ChallengeType.모든_아이템_소유_개수:
        return user.inventory.length >= (challenge as AllItemCount).count;
      case ChallengeType.특정_아이템_소유_개수: {
        const { itemId, count } = challenge as SpecificItemCount;
        const ownedItem = user.inventory.find((item) => item.id === itemId);
        return ownedItem != null && ownedItem.quantity >= count;
      }
      default:
        return false;
    }
  }

  async getClaimHistories(
    getClaimHistoriesRequestDto: GetClaimHistoriesRequestDto,
  ): Promise<GetClaimHistoriesResponseDto> {
    const { timeAt, eventId, limit, userId, filter } =
      getClaimHistoriesRequestDto;

    let query: FilterQuery<ClaimHistoryDocument> = {};
    switch (filter) {
      case ClaimHistoryFilter.ALL:
        query = {
          updatedAt: { $lte: timeAt },
        };
        break;
      case ClaimHistoryFilter.EVENT_ID:
        query = {
          eventId,
          updatedAt: { $lte: timeAt },
        };
        break;
      case ClaimHistoryFilter.USER_ID:
        query = {
          userId,
          updatedAt: { $lte: timeAt },
        };
        break;
      case ClaimHistoryFilter.EVENT_ID_AND_USER_ID:
        query = {
          eventId,
          userId,
          updatedAt: { $lte: timeAt },
        };
        break;
      default:
        throw new BadRequestException('잘못된 필터입니다.');
    }

    const claimHistories = await this.claimHistoryModel
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(limit);

    return {
      claimHistories: claimHistories.map((claimHistory) => ({
        eventId: claimHistory.eventId,
        userId: claimHistory.userId,
        status: claimHistory.status,
        failureCause: claimHistory.failureCause,
        createdAt: claimHistory.get('createdAt') as Date,
        updatedAt: claimHistory.get('updatedAt') as Date,
      })),
    };
  }
}
