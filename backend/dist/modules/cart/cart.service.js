"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToSessionCart = addToSessionCart;
exports.recentSessionCart = recentSessionCart;
/**
 * Cart (session-cart) service. Direct port of:
 *   src/app/api/session-cart/route.ts   POST + GET
 *
 * The original endpoint records add-to-cart events (for analytics) and
 * returns the recent additions populated with the product. Behaviour
 * preserved exactly — including the 204 No Content when there are no
 * recent entries (handled in the controller).
 */
const errors_1 = require("@/utils/errors");
const cart_repository_1 = require("./cart.repository");
async function addToSessionCart(productId) {
    if (!productId)
        throw new errors_1.BadRequestError('Invalid product ID');
    await cart_repository_1.cartRepo.add(productId);
}
async function recentSessionCart() {
    return cart_repository_1.cartRepo.listRecent();
}
//# sourceMappingURL=cart.service.js.map