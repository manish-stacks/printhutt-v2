import { z } from 'zod';

export const listTestimonialsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListTestimonialsQueryDTO = z.infer<typeof listTestimonialsQuerySchema>;
