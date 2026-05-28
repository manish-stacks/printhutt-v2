"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhonePePayment = void 0;
/**
 * PhonePe client — ported from src/lib/phonepay.ts. Same API surface.
 * Uses node's crypto module instead of crypto-js (zero extra dependency).
 */
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
class PhonePePayment {
    merchantId;
    saltKey;
    saltIndex;
    env;
    constructor(merchantId, saltKey, saltIndex, env = 'UAT') {
        this.merchantId = merchantId;
        this.saltKey = saltKey;
        this.saltIndex = saltIndex;
        this.env = env;
    }
    getBaseUrl() {
        return this.env === 'PROD'
            ? 'https://api.phonepe.com/apis/hermes'
            : 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    }
    generateXVerify(payload, endpoint) {
        const sha256 = crypto_1.default.createHash('sha256').update(payload + endpoint + this.saltKey).digest('hex');
        return `${sha256}###${this.saltIndex}`;
    }
    async initiatePayment(amount, merchantTransactionId, callbackUrl, userDetails) {
        try {
            const payload = {
                merchantId: this.merchantId,
                merchantTransactionId,
                amount: amount * 100,
                redirectUrl: callbackUrl,
                redirectMode: 'POST',
                callbackUrl,
                merchantUserId: `MUID${Date.now()}`,
                paymentInstrument: { type: 'PAY_PAGE' },
                ...(userDetails ? { userInfo: { ...userDetails } } : {}),
            };
            const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
            const xVerify = this.generateXVerify(base64, '/pg/v1/pay');
            const res = await axios_1.default.post(`${this.getBaseUrl()}/pg/v1/pay`, { request: base64 }, { headers: { 'Content-Type': 'application/json', 'X-VERIFY': xVerify } });
            return { success: true, ...res.data };
        }
        catch (err) {
            return {
                success: false,
                code: 'ERROR',
                message: 'Failed to initiate payment',
                error: err.message,
            };
        }
    }
    async checkStatus(merchantTransactionId) {
        try {
            const endpoint = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}`;
            const xVerify = this.generateXVerify('', endpoint);
            const res = await axios_1.default.get(`${this.getBaseUrl()}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': xVerify,
                    'X-MERCHANT-ID': this.merchantId,
                },
            });
            return { success: true, ...res.data };
        }
        catch (err) {
            return {
                success: false,
                code: 'ERROR',
                message: 'Failed to check payment status',
                error: err.message,
            };
        }
    }
}
exports.PhonePePayment = PhonePePayment;
//# sourceMappingURL=phonepe.js.map