import {
  WeaponId,
  ArmorId,
  ChallengeType,
  ConsumableId,
} from '@event-reward-platform/protocol';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChallengeDocument = Challenge & Document;
export type ContinuousLoginCountDocument = ContinuousLoginCount & Document;
export type ReturnUserDocument = ReturnUser & Document;
export type CashGreaterThanOrEqualDocument = CashGreaterThanOrEqual & Document;
export type CashLessThanOrEqualDocument = CashLessThanOrEqual & Document;
export type CoinGreaterThanOrEqualDocument = CoinGreaterThanOrEqual & Document;
export type CoinLessThanOrEqualDocument = CoinLessThanOrEqual & Document;
export type AllItemCountDocument = AllItemCount & Document;
export type SpecificItemCountDocument = SpecificItemCount & Document;

@Schema({ _id: false, discriminatorKey: 'type' })
export class Challenge {
  type: ChallengeType;
}

@Schema({ _id: false })
export class ContinuousLoginCount extends Challenge {
  @Prop({ required: true, default: 0 })
  loginCount: number;
}

@Schema({ _id: false })
export class ReturnUser extends Challenge {
  @Prop({ required: true, default: 0 })
  daysSinceLastLogin: number;
}

@Schema({ _id: false })
export class CashGreaterThanOrEqual extends Challenge {
  @Prop({ required: true, default: 0 })
  cash: number;
}

@Schema({ _id: false })
export class CashLessThanOrEqual extends Challenge {
  @Prop({ required: true, default: 0 })
  cash: number;
}

@Schema({ _id: false })
export class CoinGreaterThanOrEqual extends Challenge {
  @Prop({ required: true, default: 0 })
  coin: number;
}

@Schema({ _id: false })
export class CoinLessThanOrEqual extends Challenge {
  @Prop({ required: true, default: 0 })
  coin: number;
}

@Schema({ _id: false })
export class AllItemCount extends Challenge {
  @Prop({ required: true, default: 0 })
  count: number;
}

@Schema({ _id: false })
export class SpecificItemCount extends Challenge {
  @Prop({ required: true, type: String, default: 0 })
  itemId: WeaponId | ArmorId | ConsumableId;

  @Prop({ required: true, default: 0 })
  count: number;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);
export const ContinuousLoginCountSchema =
  SchemaFactory.createForClass(ContinuousLoginCount);
export const ReturnUserSchema = SchemaFactory.createForClass(ReturnUser);
export const CashGreaterThanOrEqualSchema = SchemaFactory.createForClass(
  CashGreaterThanOrEqual,
);
export const CashLessThanOrEqualSchema =
  SchemaFactory.createForClass(CashLessThanOrEqual);
export const CoinGreaterThanOrEqualSchema = SchemaFactory.createForClass(
  CoinGreaterThanOrEqual,
);
export const CoinLessThanOrEqualSchema =
  SchemaFactory.createForClass(CoinLessThanOrEqual);
export const AllItemCountSchema = SchemaFactory.createForClass(AllItemCount);
export const SpecificItemCountSchema =
  SchemaFactory.createForClass(SpecificItemCount);
