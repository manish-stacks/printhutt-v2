"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToWishlistSchema = void 0;
const zod_1 = require("zod");
/* ─────────── POST /api/wishlist ─────────── */
exports.addToWishlistSchema = zod_1.z.object({
    productId: zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id'),
});
//# sourceMappingURL=wishlist.validation.js.map