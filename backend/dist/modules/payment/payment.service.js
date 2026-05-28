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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.phonePeInitiate = phonePeInitiate;
exports.phonePeCallback = phonePeCallback;
exports.razorpayCreate = razorpayCreate;
exports.razorpayVerify = razorpayVerify;
exports.razorpayWebhook = razorpayWebhook;
/**
 * Payment service. Direct port of:
 *   src/app/api/payment/initiate/route.ts          (PhonePe init)
 *   src/app/api/payment/callback/route.ts          (PhonePe callback)
 *   src/app/api/payment/razorpay/create-order      (Razorpay create)
 *   src/app/api/payment/razorpay/verify            (Razorpay verify)
 *   src/app/api/payment/razorpay/webhooks          (Razorpay webhook)
 */
const crypto_1 = __importDefault(require("crypto"));
const razorpay_1 = __importDefault(require("razorpay"));
const env_1 = require("@/config/env");
const logger_1 = require("@/config/logger");
const errors_1 = require("@/utils/errors");
const orderModel_1 = __importDefault(require("@/db/models/orderModel"));
const userModel_1 = __importDefault(require("@/db/models/userModel"));
const phonepe_1 = require("./phonepe");
const phonePe = new phonepe_1.PhonePePayment(env_1.env.PHONEPE_MERCHANT_ID ?? '', env_1.env.PHONEPE_SALT_KEY ?? '', env_1.env.PHONEPE_SALT_INDEX ?? '', env_1.env.NODE_ENV === 'production' ? 'PROD' : 'UAT');
const razorpay = new razorpay_1.default({
    key_id: env_1.env.RAZORPAY_KEY_ID ?? '',
    key_secret: env_1.env.RAZORPAY_KEY_SECRET ?? '',
});
/* ───────────────── PhonePe ───────────────── */
async function phonePeInitiate(body) {
    const callbackUrl = `${env_1.env.APP_URL}/api/payment/callback`;
    const response = await phonePe.initiatePayment(body.amount, body.transactionId, callbackUrl, body.userDetails);
    if (!response.success) {
        throw new errors_1.BadRequestError(response.error || 'Payment initiation failed');
    }
    const order = await orderModel_1.default.findById(body.orderId);
    if (order) {
        order.payment.transactionId =
            response.data?.merchantTransactionId ?? '';
        await order.save();
    }
    return response.data ?? {};
}
async function phonePeCallback(merchantTransactionId) {
    const base = env_1.env.APP_URL;
    if (!merchantTransactionId)
        throw new errors_1.BadRequestError('merchantTransactionId is required');
    const response = await phonePe.checkStatus(merchantTransactionId);
    if (!response.success) {
        return { redirectTo: `${base}/orders/payment-failure`, status: 301 };
    }
    const order = await orderModel_1.default.findOne({ orderId: merchantTransactionId }).populate({
        path: 'userId',
        model: userModel_1.default,
    });
    if (!order) {
        return {
            redirectTo: `${base}/orders/confirmation?id=${merchantTransactionId}&success=false`,
            status: 301,
        };
    }
    const d = (response.data ?? {});
    order.payment = {
        transactionId: d.transactionId,
        isPaid: true,
        paidAt: new Date(),
        method: d.paymentInstrument?.type || 'unknown',
    };
    order.status = 'confirmed';
    await order.save();
    try {
        const mailer = (await Promise.resolve().then(() => __importStar(require('@/utils/mail/mailer'))));
        await mailer.sendOrderConfirmationEmail?.(order);
    }
    catch (err) {
        logger_1.logger.error('PhonePe confirmation email failed', err);
    }
    return { redirectTo: `${base}/orders/confirmation?success=true`, status: 301 };
}
/* ───────────────── Razorpay ───────────────── */
async function razorpayCreate(body) {
    const rp = await razorpay.orders.create({
        amount: Math.round(body.amount * 100),
        currency: 'INR',
        receipt: body._id,
        notes: { orderId: body.orderId },
    });
    const order = await orderModel_1.default.findOne({ orderId: body.orderId });
    if (!order)
        throw new errors_1.NotFoundError('Order not found');
    order.razorpayOrderId = rp.id;
    await order.save();
    return {
        key: env_1.env.RAZORPAY_KEY_ID,
        razorpayOrderId: rp.id,
        amount: rp.amount,
        orderId: body.orderId,
        customerName: order.shipping?.userName || 'User',
        customerEmail: order.shipping?.email || 'admin@gmail.com',
        customerPhone: order.shipping?.mobileNumber || '1234567890',
    };
}
async function razorpayVerify(body) {
    const signString = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
    const expected = crypto_1.default
        .createHmac('sha256', env_1.env.RAZORPAY_KEY_SECRET ?? '')
        .update(signString)
        .digest('hex');
    if (expected !== body.razorpay_signature)
        throw new errors_1.BadRequestError('Invalid signature');
    const order = await orderModel_1.default.findOne({ razorpayOrderId: body.razorpay_order_id }).populate({
        path: 'userId',
        model: userModel_1.default,
    });
    if (!order)
        throw new errors_1.NotFoundError('Order not found');
    order.payment = {
        transactionId: body.razorpay_payment_id,
        isPaid: true,
        paidAt: new Date(),
        method: 'razorpay',
        paymentPartner: 'razorpay',
    };
    order.status = 'confirmed';
    await order.save();
    try {
        const mailer = (await Promise.resolve().then(() => __importStar(require('@/utils/mail/mailer'))));
        await mailer.sendOrderConfirmationEmail?.(order);
    }
    catch (err) {
        logger_1.logger.error('Razorpay confirmation email failed', err);
    }
    return { success: true, order };
}
async function razorpayWebhook(rawBody, signature) {
    const expected = crypto_1.default
        .createHmac('sha256', env_1.env.RAZORPAY_WEBHOOK_SECRET ?? '')
        .update(rawBody)
        .digest('hex');
    if (expected !== signature)
        throw new errors_1.BadRequestError('Invalid signature');
    const event = JSON.parse(rawBody);
    switch (event.event) {
        case 'payment.captured': {
            const payment = event.payload.payment?.entity ?? {};
            const order = await orderModel_1.default.findOne({ razorpayOrderId: payment.order_id });
            const p = order;
            if (order && !p.payment?.isPaid) {
                order.payment = {
                    transactionId: payment.id,
                    isPaid: true,
                    paidAt: new Date(payment.created_at * 1000),
                    method: payment.method,
                    paymentPartner: 'razorpay',
                };
                order.status = 'confirmed';
                await order.save();
            }
            break;
        }
        case 'payment.failed': {
            const payment = event.payload.payment?.entity ?? {};
            const order = await orderModel_1.default.findOne({ razorpayOrderId: payment.order_id });
            const p = order;
            if (order && !p.payment?.isPaid) {
                order.payment = { isPaid: false };
                order.status = 'cancelled';
                await order.save();
            }
            break;
        }
        case 'refund.processed': {
            const refund = event.payload.refund?.entity ?? {};
            const order = await orderModel_1.default.findOne({ razorpayOrderId: refund.order_id });
            const p = order;
            if (order && p.payment?.isPaid) {
                order.payment = {
                    transactionId: refund.payment_id,
                    isPaid: false,
                };
                order.status = 'refunded';
                await order.save();
            }
            break;
        }
        default:
            break;
    }
    return { success: true };
}
//# sourceMappingURL=payment.service.js.map