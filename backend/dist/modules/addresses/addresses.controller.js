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
exports.deleteAddress = exports.updateAddress = exports.createAddress = exports.listMyAddresses = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const errors_1 = require("@/utils/errors");
const service = __importStar(require("./addresses.service"));
/* GET /api/addresses */
exports.listMyAddresses = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    const addresses = await service.listMyAddresses(req.user.id);
    return (0, api_response_1.sendOk)(res, { addresses });
});
/* POST /api/addresses */
exports.createAddress = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    const address = await service.createAddress(req.user.id, req.body);
    return (0, api_response_1.sendCreated)(res, { message: 'Address saved successfully', address });
});
/* PUT /api/addresses/:id */
exports.updateAddress = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const updated = await service.updateAddress((0, req_1.param)(req, 'id'), req.body);
    return (0, api_response_1.sendOk)(res, {
        message: 'Shipping address updated successfully',
        data: updated,
    });
});
/* DELETE /api/addresses/:id */
exports.deleteAddress = (0, async_handler_1.asyncHandler)(async (req, res) => {
    await service.deleteAddress((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { message: 'Address deleted successfully' });
});
//# sourceMappingURL=addresses.controller.js.map