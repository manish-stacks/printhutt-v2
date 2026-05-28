import mongoose, { Model, Schema } from 'mongoose';

export type SettingValueType = 'string' | 'number' | 'boolean' | 'json' | 'html' | 'image';

export interface ISiteSetting {
  key: string;             // 'siteName', 'gaId', 'metaPixelId', 'robotsTxt', 'headScripts', etc.
  value: unknown;          // string | number | bool | object | image obj
  type: SettingValueType;
  group?: string;          // 'identity', 'seo', 'analytics', 'verification', 'scripts', 'robots'
  label?: string;          // admin UI ke liye
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const siteSettingSchema = new Schema<ISiteSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'json', 'html', 'image'],
      default: 'string',
    },
    group: { type: String, default: 'general' },
    label: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

const SiteSetting: Model<ISiteSetting> =
  mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', siteSettingSchema);

export default SiteSetting;