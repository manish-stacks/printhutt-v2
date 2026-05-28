"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.byId = byId;
exports.createCoupon = createCoupon;
exports.updateCoupon = updateCoupon;
exports.deleteCoupon = deleteCoupon;
exports.storefrontActive = storefrontActive;
exports.applyCheck = applyCheck;
/**
 * Coupons service. Direct port of:
 *   src/app/api/coupon/route.ts            POST + GET (admin)
 *   src/app/api/coupon/[id]/route.ts       GET, PUT, DELETE (admin)
 *   src/app/api/coupon/apply/route.ts      POST (check user collection)
 *   src/app/api/v1/coupon/route.ts         GET (storefront active list)
 *
 * Behaviour preserved exactly.
 */
const errors_1 = require("@/utils/errors");
const coupons_repository_1 = require("./coupons.repository");
/* ──────────────── 1. Admin list ──────────────── */
async function adminList(q) {
    const { coupons, total } = await coupons_repository_1.couponsRepo.adminList(q.page, q.limit, q.search);
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
async function byId(id) {
    if (!coupons_repository_1.couponsRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const coupon = await coupons_repository_1.couponsRepo.findById(id);
    if (!coupon)
        throw new errors_1.NotFoundError('Coupon not found');
    return coupon;
}
/* ──────────────── 3. Admin create ──────────────── */
async function createCoupon(body) {
    if (!body.code || body.discountValue === undefined || !body.validFrom || !body.validUntil) {
        throw new errors_1.BadRequestError('Missing required fields');
    }
    const isActive = typeof body.isActive === 'boolean' ? body.isActive : Boolean(body.isActive);
    const isShow = typeof body.isShow === 'boolean' ? body.isShow : Boolean(body.isShow);
    return coupons_repository_1.couponsRepo.create({
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
async function updateCoupon(id, patch) {
    if (!coupons_repository_1.couponsRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const existing = await coupons_repository_1.couponsRepo.findById(id);
    if (!existing)
        throw new errors_1.NotFoundError('Coupon not found');
    // Preserve existing values when patch field is undefined (matches original)
    if (patch.code !== undefined)
        existing.code = patch.code;
    if (patch.description !== undefined)
        existing.description = patch.description;
    if (patch.discountType !== undefined)
        existing.discountType = patch.discountType;
    if (patch.discountValue !== undefined)
        existing.discountValue = patch.discountValue;
    if (patch.minimumPurchaseAmount !== undefined)
        existing.minimumPurchaseAmount = patch.minimumPurchaseAmount;
    if (patch.maxDiscountAmount !== undefined)
        existing.maxDiscountAmount = patch.maxDiscountAmount;
    if (patch.validFrom !== undefined)
        existing.validFrom = new Date(patch.validFrom);
    if (patch.validUntil !== undefined)
        existing.validUntil = new Date(patch.validUntil);
    if (patch.usageLimit !== undefined)
        existing.usageLimit = patch.usageLimit;
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
async function deleteCoupon(id) {
    if (!coupons_repository_1.couponsRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const deleted = await coupons_repository_1.couponsRepo.deleteById(id);
    if (!deleted)
        throw new errors_1.NotFoundError('Coupon not found');
}
/* ──────────────── 6. Storefront: active visible coupons ──────────────── */
async function storefrontActive() {
    return coupons_repository_1.couponsRepo.storefrontActive();
}
/* ──────────────── 7. /apply — check if user already used it ──────────────── */
async function applyCheck(userId, couponId) {
    const user = await coupons_repository_1.couponsRepo.findUserById(userId);
    const alreadyUsed = (user?.couponCollection ?? []).includes(couponId);
    return { alreadyUsed };
}
//# sourceMappingURL=coupons.service.js.map