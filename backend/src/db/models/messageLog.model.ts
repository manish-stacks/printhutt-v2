import { Schema, model, Types, Document } from 'mongoose';

export interface IMessageLog extends Document {
  userId: Types.ObjectId;
  channel: 'email' | 'sms' | 'whatsapp';
  triggerType: string;
  subject?: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  sentAt?: Date;
  meta?: Record<string, unknown>;
}

const MessageLogSchema = new Schema<IMessageLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channel: { type: String, enum: ['email', 'sms', 'whatsapp'], required: true },
    triggerType: { type: String, required: true },
    subject: String,
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    error: String,
    sentAt: Date,
    meta: Schema.Types.Mixed,
  },
  { timestamps: true }
);

MessageLogSchema.index({ userId: 1, createdAt: -1 });
MessageLogSchema.index({ triggerType: 1, createdAt: -1 });

export default model<IMessageLog>('MessageLog', MessageLogSchema);