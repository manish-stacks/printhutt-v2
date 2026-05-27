import { z } from 'zod';

/* ─────────── POST /api/cart ─────────── */
export const addToSessionCartSchema = z.object({
  product_id: z.string().min(1, 'Invalid product ID'),
});
export type AddToSessionCartDTO = z.infer<typeof addToSessionCartSchema>;
