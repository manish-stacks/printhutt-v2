import SiteSetting from '@/db/models/siteSettingModel';
import type { SettingValueType } from '@/db/models/siteSettingModel';

export const settingsRepo = {
  all: () => SiteSetting.find().lean(),

  byKey: (key: string) => SiteSetting.findOne({ key }).lean(),

  byGroup: (group: string) =>
    SiteSetting.find({ group }).lean(),

  upsert: (
    key: string,
    value: unknown,
    type?: SettingValueType,
    group?: string,
    label?: string,
    description?: string
  ) =>
    SiteSetting.findOneAndUpdate(
      { key },
      {
        $set: {
          value,
          ...(type ? { type } : {}),
          ...(group ? { group } : {}),
          ...(label ? { label } : {}),
          ...(description ? { description } : {}),
        },
      },
      { upsert: true, new: true }
    ),

  delete: (key: string) => SiteSetting.findOneAndDelete({ key }),
};