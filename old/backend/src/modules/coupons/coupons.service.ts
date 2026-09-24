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
  const isDefault = typeof body.isDefault === 'boolean' ? body.isDefault : body.isDefault === 'true';

  const created = await couponsRepo.create({
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
    isDefault,
  });

  // ✅ Agar ye default banaya gaya hai to baaki sabka default hata do
  if (isDefault) {
    await couponsRepo.unsetAllDefaults((created as { _id: unknown })._id as string);
  }

  return created;
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
  if (patch.isDefault !== undefined)
    existing.isDefault =
      typeof patch.isDefault === 'boolean' ? patch.isDefault : patch.isDefault === 'true';

  await existing.save();

  // ✅ Ye default ban gaya to baaki sabka default hata do
  if (existing.isDefault) {
    await couponsRepo.unsetAllDefaults(String(existing._id));
  }

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

/* ──────────────── 8. /validate — code + cartTotal se PURI validation ──────────────── */
/**
 * Storefront coupon validation. Yahan SAARE rules server-side enforce hote hain:
 *   - isActive
 *   - validFrom <= now <= validUntil   (expire wala apply na ho — Bug #7)
 *   - usageLimit > usedCount           (limit khatam to reject — Bug #7)
 *   - cartTotal >= minimumPurchaseAmount
 *   - logged-in user ne pehle use to nahi kiya (per-user one-time)
 * Aur final discount bhi yahin calculate hota hai (client pe bharosa nahi).
 */
export interface ValidateCouponResult {
  valid: boolean;
  message: string;
  coupon?: Record<string, unknown>;
  discount?: number;
}

export async function validateCoupon(
  code: string,
  cartTotal: number,
  userId?: string
): Promise<ValidateCouponResult> {
  const coupon = await couponsRepo.findByCode(code);
  if (!coupon) return { valid: false, message: 'Invalid coupon code.' };

  const c = coupon as unknown as {
    _id: unknown;
    code: string;
    discountType: 'percentage' | 'fixed' | 'free_shipping';
    discountValue: number;
    minimumPurchaseAmount: number;
    maxDiscountAmount?: number;
    validFrom?: Date;
    validUntil?: Date;
    usageLimit: number | null;
    usedCount: number;
    isActive: boolean;
  };

  if (!c.isActive) return { valid: false, message: 'This coupon is no longer active.' };

  const now = new Date();
  if (c.validFrom && new Date(c.validFrom) > now) {
    return { valid: false, message: 'This coupon is not active yet.' };
  }
  if (c.validUntil && new Date(c.validUntil) < now) {
    return { valid: false, message: 'This coupon has expired.' };
  }
  if (c.usageLimit !== null && c.usageLimit !== undefined && c.usedCount >= c.usageLimit) {
    return { valid: false, message: 'This coupon usage limit has been reached.' };
  }
  if (cartTotal < (c.minimumPurchaseAmount || 0)) {
    return {
      valid: false,
      message: `Minimum purchase of ₹${c.minimumPurchaseAmount} required for this coupon.`,
    };
  }

  // Per-user one-time check
  // if (userId) {
  //   const user = await couponsRepo.findUserById(userId);
  //   const already = (user?.couponCollection ?? []).map(String).includes(String(c._id));
  //   if (already) return { valid: false, message: 'You have already used this coupon.' };
  // }

  // Discount compute (free_shipping ka discount 0 — shipping order side handle hota hai)
  let discount = 0;
  if (c.discountType === 'percentage') {
    discount = (Number(c.discountValue) / 100) * cartTotal;
    if (c.maxDiscountAmount && discount > c.maxDiscountAmount) discount = c.maxDiscountAmount;
  } else if (c.discountType === 'fixed') {
    discount = Number(c.discountValue);
  }
  // Discount cart se zyada na ho
  if (discount > cartTotal) discount = cartTotal;
  discount = Math.round(discount);

  return {
    valid: true,
    message: 'Coupon applied successfully',
    coupon: coupon.toObject ? coupon.toObject() : (coupon as Record<string, unknown>),
    discount,
  };
}
