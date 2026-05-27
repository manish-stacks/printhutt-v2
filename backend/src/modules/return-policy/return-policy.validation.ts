import { z } from 'zod';
export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListQueryDTO = z.infer<typeof listQuerySchema>;
export const upsertSchema = z.object({
  returnPeriod: z.string().min(1),
  restockingFee: z.coerce.number().optional(),
  policyDetails: z.string().min(1),
});
export type UpsertDTO = z.infer<typeof upsertSchema>;
