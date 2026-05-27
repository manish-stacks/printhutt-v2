import { z } from 'zod';

/* ─────────── GET /api/coupons (admin) ─────────── */
export const listCouponsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListCouponsQueryDTO = z.infer<typeof listCouponsQuerySchema>;

/* ─────────── POST /api/coupons (admin create) ─────────── */
export const createCouponSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed', 'free_shipping']).optional(),
  discountValue: z.coerce.number().nonnegative(),
  minimumPurchaseAmount: z.coerce.number().optional(),
  maxDiscountAmount: z.coerce.number().optional(),
  validFrom: z.union([z.string(), z.date()]),
  validUntil: z.union([z.string(), z.date()]),
  usageLimit: z.coerce.number().int().optional(),
  isActive: z.union([z.boolean(), z.string()]).optional(),
  isShow: z.union([z.boolean(), z.string()]).optional(),
});
export type CreateCouponDTO = z.infer<typeof createCouponSchema>;

/* ─────────── PUT /api/coupons/:id ─────────── */
export const updateCouponSchema = createCouponSchema.partial();
export type UpdateCouponDTO = z.infer<typeof updateCouponSchema>;

/* ─────────── POST /api/coupons/apply ─────────── */
export const applyCouponSchema = z.object({
  coupon: z.object({
    id: z.string().min(1),
  }).passthrough(),
});
export type ApplyCouponDTO = z.infer<typeof applyCouponSchema>;
