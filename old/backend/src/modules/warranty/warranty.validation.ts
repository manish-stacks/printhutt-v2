import { z } from 'zod';
export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListQueryDTO = z.infer<typeof listQuerySchema>;

export const upsertSchema = z.object({
  warrantyType: z.string().min(1),
  durationMonths: z.coerce.number(),
  coverage: z.string().min(1),
  claimProcess: z.string().min(1),
});
export type UpsertDTO = z.infer<typeof upsertSchema>;

export const patchSchema = z.object({ status: z.union([z.string(), z.boolean()]) });
export type PatchDTO = z.infer<typeof patchSchema>;
