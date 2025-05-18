import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  InventoryItemType,
  WeaponId,
  ArmorId,
  ConsumableId,
  Role,
  CouponId,
} from '@event-reward-platform/protocol';

export type UserDocument = User & Document;

@Schema({ _id: false })
export class InventoryItem {
  @Prop({ required: true, type: String, enum: InventoryItemType })
  type: InventoryItemType;

  @Prop({ required: true, type: String })
  id: WeaponId | ArmorId | ConsumableId;

  @Prop({ required: true, default: 0 })
  quantity: number;
}

@Schema({ _id: false })
export class Coupon {
  @Prop({ required: true, type: String, enum: CouponId })
  couponId: CouponId;

  @Prop({ required: true, default: 0 })
  quantity: number;
}

@Schema({ _id: false })
export class ConsecutiveLogin {
  @Prop({ required: true, default: new Date() })
  startTime: Date;

  @Prop({ required: true, default: 0 })
  count: number;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, default: Role.USER, type: String })
  role: Role;

  @Prop({ required: true, default: 0 })
  cash: number;

  @Prop({ required: true, default: 0 })
  coins: number;

  @Prop({ type: [InventoryItem], default: [] })
  inventory: InventoryItem[];

  @Prop({ type: [Coupon], default: [] })
  coupons: Coupon[];

  @Prop({ required: true, default: 0 })
  todayLoginCount: number;

  @Prop({
    type: ConsecutiveLogin,
    default: { startTime: new Date(), count: 0 },
  })
  consecutiveLogin: ConsecutiveLogin;

  @Prop({ required: true, default: new Date() })
  lastLoginAt: Date;

  @Prop({ default: new Date() })
  bannedUntil: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
