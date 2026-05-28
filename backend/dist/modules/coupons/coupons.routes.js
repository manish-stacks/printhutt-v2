"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const validate_middleware_1 = require("@/middlewares/validate.middleware");
const controller = __importStar(require("./coupons.controller"));
const coupons_validation_1 = require("./coupons.validation");
const router = (0, express_1.Router)();
/* ─── Storefront ─────────────────────────────────────────────── */
// Original: GET /api/v1/coupon
router.get('/storefront', controller.storefrontActive);
// Original: POST /api/coupon/apply (logged-in users only)
router.post('/apply', auth_middleware_1.requireAuth, (0, validate_middleware_1.validate)(coupons_validation_1.applyCouponSchema), controller.applyCheck);
/* ─── Admin ─────────────────────────────────────────────────── */
// Original: GET /api/coupon
router.get('/', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(coupons_validation_1.listCouponsQuerySchema, 'query'), controller.adminList);
// Original: POST /api/coupon
router.post('/', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(coupons_validation_1.createCouponSchema), controller.createCoupon);
// Original: GET /api/coupon/[id]
router.get('/:id', ...auth_middleware_1.requireAdmin, controller.byId);
// Original: PUT /api/coupon/[id]
router.put('/:id', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(coupons_validation_1.updateCouponSchema), controller.updateCoupon);
// Original: DELETE /api/coupon/[id]
router.delete('/:id', ...auth_middleware_1.requireAdmin, controller.deleteCoupon);
exports.default = router;
//# sourceMappingURL=coupons.routes.js.map