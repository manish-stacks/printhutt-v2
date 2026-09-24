import { z } from 'zod';

/* POST /api/cart */
export const addToSessionCartSchema = z.object({
  product_id: z.string().min(1, 'Invalid product ID'),
});
export type AddToSessionCartDTO = z.infer<typeof addToSessionCartSchema>;

/* GET /api/cart (admin paginated) */
export const listCartQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
export type ListCartQueryDTO = z.infer<typeof listCartQuerySchema>;

/* POST /api/cart/bulk-delete */
export const bulkDeleteSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id')).min(1, 'No ids provided'),
});
export type BulkDeleteDTO = z.infer<typeof bulkDeleteSchema>;