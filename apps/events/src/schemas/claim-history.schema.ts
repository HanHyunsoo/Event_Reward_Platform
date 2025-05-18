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
    default: ClaimStatus.PROCESSING,
  })
  status: ClaimStatus;

  @Prop()
  failureCause?: string;
}

export const ClaimHistorySchema = SchemaFactory.createForClass(ClaimHistory);
ClaimHistorySchema.index({ eventId: 1, userId: 1, updatedAt: -1 });
