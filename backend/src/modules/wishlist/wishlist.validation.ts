import { z } from 'zod';

/* ─────────── POST /api/wishlist ─────────── */
export const addToWishlistSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id'),
});
export type AddToWishlistDTO = z.infer<typeof addToWishlistSchema>;
