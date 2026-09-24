import { Router } from 'express';
import { optionalAuth, requireAdmin, requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './coupons.controller';
import {
  applyCouponSchema,
  createCouponSchema,
  listCouponsQuerySchema,
  updateCouponSchema,
  validateCouponSchema,
} from './coupons.validation';

const router = Router();

/* ─── Storefront ─────────────────────────────────────────────── */
// Original: GET /api/v1/coupon
router.get('/storefront', controller.storefrontActive);
// ✅ NEW: code + cartTotal se validate (login optional — guest/user dono).
//    Checkout par coupon apply isi se hoga (admin endpoint nahi → FORBIDDEN fix, Bug #4)
router.post('/validate', optionalAuth, validate(validateCouponSchema), controller.validateByCode);
// Original: POST /api/coupon/apply (logged-in users only)
router.post('/apply', requireAuth, validate(applyCouponSchema), controller.applyCheck);

/* ─── Admin ─────────────────────────────────────────────────── */
// Original: GET /api/coupon
router.get(
  '/',
  ...requireAdmin,
  validate(listCouponsQuerySchema, 'query'),
  controller.adminList
);
// Original: POST /api/coupon
router.post(
  '/',
  ...requireAdmin,
  validate(createCouponSchema),
  controller.createCoupon
);
// Original: GET /api/coupon/[id]
router.get('/:id', ...requireAdmin, controller.byId);
// Original: PUT /api/coupon/[id]
router.put(
  '/:id',
  ...requireAdmin,
  validate(updateCouponSchema),
  controller.updateCoupon
);
// Original: DELETE /api/coupon/[id]
router.delete('/:id', ...requireAdmin, controller.deleteCoupon);

export default router;
