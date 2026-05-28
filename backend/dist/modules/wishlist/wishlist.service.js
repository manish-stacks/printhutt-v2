"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToWishlist = addToWishlist;
exports.getWishlist = getWishlist;
exports.removeFromWishlist = removeFromWishlist;
/**
 * Wishlist service. Direct port of:
 *   src/app/api/v1/wishlist/route.ts        POST + GET
 *   src/app/api/v1/wishlist/[id]/route.ts   DELETE
 *
 * Behaviour preserved exactly — including the "soft" response when the
 * GET endpoint is called without a session (returns success:false +
 * data:[] with HTTP 200 instead of 401, so the frontend can treat an
 * anonymous wishlist as empty without UX errors).
 */
const errors_1 = require("@/utils/errors");
const wishlist_repository_1 = require("./wishlist.repository");
/* ──────────────── 1. Add to wishlist ──────────────── */
async function addToWishlist(userId, productId) {
    let wishlist = await wishlist_repository_1.wishlistRepo.findByUser(userId);
    if (!wishlist) {
        await wishlist_repository_1.wishlistRepo.createForUser(userId, productId);
        return { alreadyExists: false };
    }
    const exists = await wishlist_repository_1.wishlistRepo.hasProduct(userId, productId);
    if (exists)
        return { alreadyExists: true };
    await wishlist_repository_1.wishlistRepo.addProduct(userId, productId);
    return { alreadyExists: false };
}
/* ──────────────── 2. Get wishlist (logged-in or anonymous) ──────────────── */
async function getWishlist(userId) {
    if (!userId)
        return { loggedIn: false, data: [] };
    const wishlist = await wishlist_repository_1.wishlistRepo.findByUserPopulated(userId);
    return { loggedIn: true, data: wishlist };
}
/* ──────────────── 3. Remove from wishlist ──────────────── */
async function removeFromWishlist(userId, productId) {
    if (!wishlist_repository_1.wishlistRepo.isValidObjectId(productId)) {
        throw new errors_1.BadRequestError('Invalid ID');
    }
    const wishlist = await wishlist_repository_1.wishlistRepo.findByUser(userId);
    if (!wishlist)
        throw new errors_1.NotFoundError('Product not found in wishlist');
    // Filter out the matching product
    wishlist.items = wishlist.items.filter((item) => item.productId.toString() !== productId);
    await wishlist.save();
}
//# sourceMappingURL=wishlist.service.js.map