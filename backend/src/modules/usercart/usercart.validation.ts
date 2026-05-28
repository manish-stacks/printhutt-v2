import { z } from 'zod';

const cartItemSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id'),
  variantId: z.string().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  quantity: z.number().int().positive().default(1),
  price: z.number().nonnegative(),
  custom_data: z.record(z.unknown()).optional(),
});

export const addItemSchema = cartItemSchema;
export type AddItemDTO = z.infer<typeof addItemSchema>;

export const updateQtySchema = z.object({
  itemId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid item id'),
  quantity: z.number().int().positive(),
});
export type UpdateQtyDTO = z.infer<typeof updateQtySchema>;

export const mergeSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'No items to merge'),
});
export type MergeDTO = z.infer<typeof mergeSchema>;

export const syncSchema = z.object({
  items: z.array(cartItemSchema),  // .min(1) nahi — empty bhi valid
});
export type SyncDTO = z.infer<typeof syncSchema>;