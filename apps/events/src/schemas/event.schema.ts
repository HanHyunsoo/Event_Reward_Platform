import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ChallengeType, RewardType } from '@event-reward-platform/protocol';
import {
  AllItemCountSchema,
  CashGreaterThanOrEqualSchema,
  CashLessThanOrEqualSchema,
  Challenge,
  CoinGreaterThanOrEqualSchema,
  CoinLessThanOrEqualSchema,
  ContinuousLoginCountSchema,
  ReturnUserSchema,
  SpecificItemCountSchema,
} from './challenge.subschema';
import {
  CashRewardSchema,
  CoinRewardSchema,
  CouponRewardSchema,
  ItemRewardSchema,
  Reward,
} from './reward.subschema';

export type EventDocument = Event & Document;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, index: 1 })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true, default: true })
  isPublic: boolean;

  @Prop({ type: Challenge })
  challenge?: Challenge;

  @Prop({ type: [Reward], required: true, default: [] })
  rewards: Reward[];

  // 값이 존재하면 선착순 이벤트로 간주됨
  @Prop()
  rewardLimit: number;

  @Prop({ required: true })
  creatorId: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.path<mongoose.Schema.Types.Subdocument>('challenge').discriminator(
  ChallengeType.누적_로그인_횟수,
  ContinuousLoginCountSchema,
);
EventSchema.path<mongoose.Schema.Types.Subdocument>('challenge').discriminator(
  ChallengeType.복귀_유저,
  ReturnUserSchema,
);
EventSchema.path<mongoose.Schema.Types.Subdocument>('challenge').discriminator(
  ChallengeType.캐시_소유_이상,
  CashGreaterThanOrEqualSchema,
);
EventSchema.path<mongoose.Schema.Types.Subdocument>('challenge').discriminator(
  ChallengeType.캐시_소유_이하,
  CashLessThanOrEqualSchema,
);
EventSchema.path<mongoose.Schema.Types.Subdocument>('challenge').discriminator(
  ChallengeType.코인_소유_이상,
  CoinGreaterThanOrEqualSchema,
);
EventSchema.path<mongoose.Schema.Types.Subdocument>('challenge').discriminator(
  ChallengeType.코인_소유_이하,
  CoinLessThanOrEqualSchema,
);
EventSchema.path<mongoose.Schema.Types.Subdocument>('challenge').discriminator(
  ChallengeType.모든_아이템_소유_개수,
  AllItemCountSchema,
);
EventSchema.path<mongoose.Schema.Types.Subdocument>('challenge').discriminator(
  ChallengeType.특정_아이템_소유_개수,
  SpecificItemCountSchema,
);

const rewardArray =
  EventSchema.path<mongoose.Schema.Types.DocumentArray>('rewards');
rewardArray.discriminator(RewardType.ITEM, ItemRewardSchema);
rewardArray.discriminator(RewardType.COUPON, CouponRewardSchema);
rewardArray.discriminator(RewardType.CASH, CashRewardSchema);
rewardArray.discriminator(RewardType.COIN, CoinRewardSchema);
