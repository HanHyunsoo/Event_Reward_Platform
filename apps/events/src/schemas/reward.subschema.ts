import { Schema, SchemaFactory } from '@nestjs/mongoose';

import { CouponId, RewardType } from '@event-reward-platform/protocol';

import {
  ArmorId,
  ConsumableId,
  InventoryItemType,
  WeaponId,
} from '@event-reward-platform/protocol/users/item.enum';
import { Prop } from '@nestjs/mongoose';

export type RewardDocument = Reward & Document;
export type CouponRewardDocument = CouponReward & Document;
export type CashRewardDocument = CashReward & Document;
export type CoinRewardDocument = CoinReward & Document;
export type ItemRewardDocument = ItemReward & Document;

@Schema({ _id: false, discriminatorKey: 'rewardType' })
export class Reward {
  rewardType: RewardType;

  @Prop({ required: true, default: 1 })
  quantity: number;
}

@Schema({ _id: false })
export class CouponReward extends Reward {
  @Prop({ required: true, type: String, enum: CouponId })
  couponId: CouponId;
}

@Schema({ _id: false })
export class CashReward extends Reward {}

@Schema({ _id: false })
export class CoinReward extends Reward {}

@Schema({ _id: false })
export class ItemReward extends Reward {
  @Prop({ required: true, type: String, enum: InventoryItemType })
  itemType: InventoryItemType;

  @Prop({
    required: true,
    type: String,
    enum: [
      ...Object.values(WeaponId),
      ...Object.values(ArmorId),
      ...Object.values(ConsumableId),
    ],
  })
  itemId: WeaponId | ArmorId | ConsumableId;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
export const CouponRewardSchema = SchemaFactory.createForClass(CouponReward);
export const CashRewardSchema = SchemaFactory.createForClass(CashReward);
export const CoinRewardSchema = SchemaFactory.createForClass(CoinReward);
export const ItemRewardSchema = SchemaFactory.createForClass(ItemReward);
