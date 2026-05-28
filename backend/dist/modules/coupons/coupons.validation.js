"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCouponSchema = exports.updateCouponSchema = exports.createCouponSchema = exports.listCouponsQuerySchema = void 0;
const zod_1 = require("zod");
/* ─────────── GET /api/coupons (admin) ─────────── */
exports.listCouponsQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
/* ─────────── POST /api/coupons (admin create) ─────────── */
exports.createCouponSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    discountType: zod_1.z.enum(['percentage', 'fixed', 'free_shipping']).optional(),
    discountValue: zod_1.z.coerce.number().nonnegative(),
    minimumPurchaseAmount: zod_1.z.coerce.number().optional(),
    maxDiscountAmount: zod_1.z.coerce.number().optional(),
    validFrom: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    validUntil: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    usageLimit: zod_1.z.coerce.number().int().optional(),
    isActive: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]).optional(),
    isShow: zod_1.z.union([zod_1.z.boolean(), zod_1.z.string()]).optional(),
});
/* ─────────── PUT /api/coupons/:id ─────────── */
exports.updateCouponSchema = exports.createCouponSchema.partial();
/* ─────────── POST /api/coupons/apply ─────────── */
exports.applyCouponSchema = zod_1.z.object({
    coupon: zod_1.z.object({
        id: zod_1.z.string().min(1),
    }).passthrough(),
});
//# sourceMappingURL=coupons.validation.js.map