import { z } from 'zod';

const valueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.record(z.unknown()),
  z.null(),
]);

const settingItemSchema = z.object({
  key: z.string().min(1),
  value: valueSchema,
  type: z.enum(['string', 'number', 'boolean', 'json', 'html', 'image']).optional(),
  group: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
});

export const bulkUpsertSchema = z.object({
  settings: z.array(settingItemSchema).min(1),
});
export type BulkUpsertDTO = z.infer<typeof bulkUpsertSchema>;

export const singleUpsertSchema = settingItemSchema;
export type SingleUpsertDTO = z.infer<typeof singleUpsertSchema>;