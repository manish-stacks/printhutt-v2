import { z } from 'zod';
export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListQueryDTO = z.infer<typeof listQuerySchema>;
export const upsertSchema = z.object({
  shippingType: z.string().min(1),
  deliveryDays: z.string().min(1),
}).passthrough();
export type UpsertDTO = z.infer<typeof upsertSchema>;
