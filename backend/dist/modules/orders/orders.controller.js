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
exports.updateStatus = exports.updateShipping = exports.createOrder = exports.deleteOrder = exports.byIdPending = exports.byId = exports.list = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const errors_1 = require("@/utils/errors");
const service = __importStar(require("./orders.service"));
/* GET /api/orders */
exports.list = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    const result = await service.list({ id: req.user.id, role: req.user.role }, req.query);
    return res.json(result);
});
/* GET /api/orders/:id  (default — non-pending nav) */
exports.byId = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.byId((0, req_1.param)(req, 'id'), false);
    return res.json(result);
});
/* GET /api/orders/:id/pending  (pending-only nav) */
exports.byIdPending = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.byId((0, req_1.param)(req, 'id'), true);
    return res.json(result);
});
/* DELETE /api/orders/:id  (and /api/orders/:id/pending  share same handler) */
exports.deleteOrder = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.deleteOrder((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, result);
});
/* POST /api/orders */
exports.createOrder = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    const result = await service.createOrder(req.user.id, req.body);
    return res.json(result);
});
/* PATCH /api/orders/:id/shipping */
exports.updateShipping = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.updateOrderShipping((0, req_1.param)(req, 'id'), req.body);
    return (0, api_response_1.sendOk)(res, result);
});
/* PATCH /api/orders/:id/status */
exports.updateStatus = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.updateOrderStatus((0, req_1.param)(req, 'id'), req.body);
    return (0, api_response_1.sendOk)(res, result);
});
//# sourceMappingURL=orders.controller.js.map