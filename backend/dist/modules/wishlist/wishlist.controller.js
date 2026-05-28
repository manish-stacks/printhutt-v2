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
exports.removeFromWishlist = exports.getWishlist = exports.addToWishlist = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const errors_1 = require("@/utils/errors");
const service = __importStar(require("./wishlist.service"));
/* POST /api/wishlist */
exports.addToWishlist = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    const { alreadyExists } = await service.addToWishlist(req.user.id, req.body.productId);
    if (alreadyExists) {
        return (0, api_response_1.sendOk)(res, { message: 'Product already in wishlist' });
    }
    return (0, api_response_1.sendCreated)(res, { message: 'Product added to wishlist' });
});
/* GET /api/wishlist  — soft 200 even when anonymous (matches original) */
exports.getWishlist = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.getWishlist(req.user?.id ?? null);
    if (!result.loggedIn) {
        return (0, api_response_1.sendOk)(res, {
            success: false,
            message: 'Not logged in',
            data: [],
        });
    }
    return (0, api_response_1.sendOk)(res, { message: 'Data fetched successfully', data: result.data });
});
/* DELETE /api/wishlist/:id  — removes a single product */
exports.removeFromWishlist = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    await service.removeFromWishlist(req.user.id, (0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { message: 'Wishlist item removed' });
});
//# sourceMappingURL=wishlist.controller.js.map