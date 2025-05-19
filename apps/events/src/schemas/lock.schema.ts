import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LockDocument = Lock & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Lock {
  @Prop({ required: true, unique: true })
  key: string;
}

export const LockSchema = SchemaFactory.createForClass(Lock);
LockSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });
