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
exports.applyCheck = exports.storefrontActive = exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.byId = exports.adminList = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const errors_1 = require("@/utils/errors");
const service = __importStar(require("./coupons.service"));
/* GET /api/coupons */
exports.adminList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.adminList(req.query);
    return (0, api_response_1.sendOk)(res, result);
});
/* GET /api/coupons/:id */
exports.byId = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const coupon = await service.byId((0, req_1.param)(req, 'id'));
    return res.json(coupon);
});
/* POST /api/coupons */
exports.createCoupon = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const coupon = await service.createCoupon(req.body);
    return (0, api_response_1.sendCreated)(res, { message: 'Coupon created successfully', data: coupon });
});
/* PUT /api/coupons/:id */
exports.updateCoupon = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const updated = await service.updateCoupon((0, req_1.param)(req, 'id'), req.body);
    return (0, api_response_1.sendOk)(res, { message: 'Coupon updated successfully', data: updated });
});
/* DELETE /api/coupons/:id */
exports.deleteCoupon = (0, async_handler_1.asyncHandler)(async (req, res) => {
    await service.deleteCoupon((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { message: 'Coupon deleted successfully!' });
});
/* GET /api/coupons/storefront — active + visible */
exports.storefrontActive = (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const coupons = await service.storefrontActive();
    return (0, api_response_1.sendOk)(res, { coupons });
});
/* POST /api/coupons/apply — check user.couponCollection */
exports.applyCheck = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError('Unauthorized User');
    const body = req.body;
    const { alreadyUsed } = await service.applyCheck(req.user.id, body.coupon.id);
    if (alreadyUsed) {
        return (0, api_response_1.sendOk)(res, { message: 'Coupon already used.' });
    }
    return (0, api_response_1.sendOk)(res, { message: 'Coupon available' });
});
//# sourceMappingURL=coupons.controller.js.map