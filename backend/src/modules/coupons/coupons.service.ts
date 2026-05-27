/**
 * Coupons service. Direct port of:
 *   src/app/api/coupon/route.ts            POST + GET (admin)
 *   src/app/api/coupon/[id]/route.ts       GET, PUT, DELETE (admin)
 *   src/app/api/coupon/apply/route.ts      POST (check user collection)
 *   src/app/api/v1/coupon/route.ts         GET (storefront active list)
 *
 * Behaviour preserved exactly.
 */
import {
  BadRequestError,
  NotFoundError,
} from '@/utils/errors';
import { couponsRepo } from './coupons.repository';
import type {
  CreateCouponDTO,
  ListCouponsQueryDTO,
  UpdateCouponDTO,
} from './coupons.validation';

/* ──────────────── 1. Admin list ──────────────── */
export async function adminList(q: ListCouponsQueryDTO): Promise<unknown> {
  const { coupons, total } = await couponsRepo.adminList(q.page, q.limit, q.search);
  return {
    coupons,
    pagination: {
      total,
      pages: Math.ceil(total / q.limit),
      page: q.page,
      limit: q.limit,
    },
  };
}

/* ──────────────── 2. Admin by id ──────────────── */
export async function byId(id: string): Promise<unknown> {
  if (!couponsRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Product ID');
  const coupon = await couponsRepo.findById(id);
  if (!coupon) throw new NotFoundError('Coupon not found');
  return coupon;
}

/* ──────────────── 3. Admin create ──────────────── */
export async function createCoupon(body: CreateCouponDTO): Promise<unknown> {
  if (!body.code || body.discountValue === undefined || !body.validFrom || !body.validUntil) {
    throw new BadRequestError('Missing required fields');
  }

  const isActive = typeof body.isActive === 'boolean' ? body.isActive : Boolean(body.isActive);
  const isShow = typeof body.isShow === 'boolean' ? body.isShow : Boolean(body.isShow);

  return couponsRepo.create({
    code: body.code,
    description: body.description,
    discountType: body.discountType,
    discountValue: body.discountValue,
    minimumPurchaseAmount: body.minimumPurchaseAmount,
    maxDiscountAmount: body.maxDiscountAmount,
    validFrom: body.validFrom,
    validUntil: body.validUntil,
    usageLimit: body.usageLimit,
    isActive,
    isShow,
  });
}

/* ──────────────── 4. Admin update ──────────────── */
export async function updateCoupon(
  id: string,
  patch: UpdateCouponDTO
): Promise<unknown> {
  if (!couponsRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Product ID');
  const existing = await couponsRepo.findById(id);
  if (!existing) throw new NotFoundError('Coupon not found');

  // Preserve existing values when patch field is undefined (matches original)
  if (patch.code !== undefined) existing.code = patch.code;
  if (patch.description !== undefined) existing.description = patch.description;
  if (patch.discountType !== undefined) existing.discountType = patch.discountType;
  if (patch.discountValue !== undefined) existing.discountValue = patch.discountValue;
  if (patch.minimumPurchaseAmount !== undefined)
    existing.minimumPurchaseAmount = patch.minimumPurchaseAmount;
  if (patch.maxDiscountAmount !== undefined)
    existing.maxDiscountAmount = patch.maxDiscountAmount;
  if (patch.validFrom !== undefined) existing.validFrom = new Date(patch.validFrom);
  if (patch.validUntil !== undefined) existing.validUntil = new Date(patch.validUntil);
  if (patch.usageLimit !== undefined) existing.usageLimit = patch.usageLimit;
  if (patch.isActive !== undefined)
    existing.isActive =
      typeof patch.isActive === 'boolean' ? patch.isActive : Boolean(patch.isActive);
  if (patch.isShow !== undefined)
    existing.isShow =
      typeof patch.isShow === 'boolean' ? patch.isShow : Boolean(patch.isShow);

  await existing.save();
  return existing;
}

/* ──────────────── 5. Admin delete ──────────────── */
export async function deleteCoupon(id: string): Promise<void> {
  if (!couponsRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Product ID');
  const deleted = await couponsRepo.deleteById(id);
  if (!deleted) throw new NotFoundError('Coupon not found');
}

/* ──────────────── 6. Storefront: active visible coupons ──────────────── */
export async function storefrontActive(): Promise<unknown[]> {
  return couponsRepo.storefrontActive();
}

/* ──────────────── 7. /apply — check if user already used it ──────────────── */
export async function applyCheck(
  userId: string,
  couponId: string
): Promise<{ alreadyUsed: boolean }> {
  const user = await couponsRepo.findUserById(userId);
  const alreadyUsed = (user?.couponCollection ?? []).includes(couponId);
  return { alreadyUsed };
}
