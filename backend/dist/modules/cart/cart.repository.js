"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRepo = void 0;
const session_carts_model_1 = __importDefault(require("@/db/models/session_carts.model"));
const productModel_1 = __importDefault(require("@/db/models/productModel"));
exports.cartRepo = {
    /* ─── Append a session-cart entry (analytics for guest sessions) ─── */
    add: (productId) => session_carts_model_1.default.create({ productId }),
    /* ─── Recent session-cart entries, joined with product details ─── */
    listRecent: () => session_carts_model_1.default.find()
        .sort({ createdAt: -1 })
        .populate({ path: 'productId', model: productModel_1.default })
        .lean(),
};
//# sourceMappingURL=cart.repository.js.map