import { z } from 'zod';

/* GET /api/reviews  (admin paginated list) */
export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListReviewsQueryDTO = z.infer<typeof listReviewsQuerySchema>;
