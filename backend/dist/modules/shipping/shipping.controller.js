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
exports.shiprocketWebhook = exports.shiprocketCreateOrder = exports.shiprocketTrack = exports.fshipTrack = exports.options = exports.remove = exports.update = exports.create = exports.byId = exports.adminList = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const service = __importStar(require("./shipping.service"));
exports.adminList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const r = await service.adminList(req.query);
    return res.json(r);
});
exports.byId = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const s = await service.byId((0, req_1.param)(req, 'id'));
    return res.json(s);
});
exports.create = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.create(req.body);
    return (0, api_response_1.sendCreated)(res, { message: 'Data inserted successfully', data });
});
exports.update = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.update((0, req_1.param)(req, 'id'), req.body);
    return (0, api_response_1.sendOk)(res, { message: 'Shipping updated successfully', data });
});
exports.remove = (0, async_handler_1.asyncHandler)(async (req, res) => {
    await service.remove((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { message: 'Shipping deleted successfully' });
});
exports.options = (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const data = await service.options();
    return (0, api_response_1.sendOk)(res, { message: 'Data fetched successfully', data });
});
exports.fshipTrack = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const waybill = String(req.body.waybill ?? req.query.waybill ?? '');
    const data = await service.fshipTrack(waybill);
    return res.json(data);
});
exports.shiprocketTrack = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const awb = String(req.params.awb ?? req.query.awb ?? '');
    const data = await service.shiprocketTrack(awb);
    return res.json(data);
});
exports.shiprocketCreateOrder = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.shiprocketCreateOrder(req.body);
    return res.json(data);
});
exports.shiprocketWebhook = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.shiprocketWebhook(req.body);
    return res.json(data);
});
//# sourceMappingURL=shipping.controller.js.map