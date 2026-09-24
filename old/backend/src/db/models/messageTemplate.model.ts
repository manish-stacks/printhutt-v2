import { Schema, model, Document } from 'mongoose';

export type MessageTriggerType =
  | 'manual'
  | 'order_pending_reminder'
  | 'wishlist_abandoned';

export type MessageChannel = 'email' | 'sms' | 'whatsapp';

export interface IMessageTemplate extends Document {
  name: string;
  triggerType: MessageTriggerType;
  channel: MessageChannel;
  subject?: string;       // email me use hota
  body: string;            // {{userName}}, {{productName}}, {{orderId}} placeholders
  enabled: boolean;
  delayHours?: number;     // auto-trigger ke kitne ghante baad
  createdAt: Date;
  updatedAt: Date;
}

const MessageTemplateSchema = new Schema<IMessageTemplate>(
  {
    name: { type: String, required: true },
    triggerType: {
      type: String,
      enum: ['manual', 'order_pending_reminder', 'wishlist_abandoned'],
      required: true,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp'],
      required: true,
    },
    subject: { type: String },
    body: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    delayHours: { type: Number, default: 24 },
  },
  { timestamps: true }
);

export default model<IMessageTemplate>('MessageTemplate', MessageTemplateSchema);