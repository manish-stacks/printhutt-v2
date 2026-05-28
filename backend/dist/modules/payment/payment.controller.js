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
exports.razorpayWebhook = exports.razorpayVerify = exports.razorpayCreate = exports.phonePeCallback = exports.phonePeInitiate = void 0;
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const service = __importStar(require("./payment.service"));
/* PhonePe initiate */
exports.phonePeInitiate = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.phonePeInitiate(req.body);
    return res.json(data);
});
/* PhonePe callback */
exports.phonePeCallback = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const body = req.body ?? {};
    const query = req.query ?? {};
    const mtid = body.merchantTransactionId || body.transactionId || query.merchantTransactionId || query.transactionId || '';
    const result = await service.phonePeCallback(mtid);
    return res.redirect(result.status, result.redirectTo);
});
/* Razorpay create */
exports.razorpayCreate = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.razorpayCreate(req.body);
    return res.json(data);
});
/* Razorpay verify */
exports.razorpayVerify = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.razorpayVerify(req.body);
    return (0, api_response_1.sendOk)(res, result);
});
/* Razorpay webhook (raw body required) */
exports.razorpayWebhook = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'] ?? '';
    // raw body captured by the route's middleware
    const raw = req.rawBody ?? JSON.stringify(req.body);
    const result = await service.razorpayWebhook(raw, signature);
    return res.json(result);
});
//# sourceMappingURL=payment.controller.js.map