import { z } from 'zod';

/* GET /api/sliders */
export const listSlidersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListSlidersQueryDTO = z.infer<typeof listSlidersQuerySchema>;
