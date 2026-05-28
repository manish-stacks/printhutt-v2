"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addToSessionCartSchema = void 0;
const zod_1 = require("zod");
/* ─────────── POST /api/cart ─────────── */
exports.addToSessionCartSchema = zod_1.z.object({
    product_id: zod_1.z.string().min(1, 'Invalid product ID'),
});
//# sourceMappingURL=cart.validation.js.map