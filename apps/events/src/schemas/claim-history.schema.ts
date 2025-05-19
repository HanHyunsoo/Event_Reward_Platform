import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ClaimStatus } from '@event-reward-platform/protocol';

export type ClaimHistoryDocument = ClaimHistory & Document;

@Schema({ timestamps: true })
export class ClaimHistory {
  @Prop({ required: true })
  eventId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({
    required: true,
    type: String,
    enum: ClaimStatus,
  })
  status: ClaimStatus;

  @Prop()
  failureCause?: string;
}

export const ClaimHistorySchema = SchemaFactory.createForClass(ClaimHistory);
ClaimHistorySchema.index({ eventId: 1, userId: 1, updatedAt: -1 });
ClaimHistorySchema.index({ userId: 1, updatedAt: -1 });
ClaimHistorySchema.index({ eventId: 1, updatedAt: -1 });
ClaimHistorySchema.index({ updatedAt: -1 });
