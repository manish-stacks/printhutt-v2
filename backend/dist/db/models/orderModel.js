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
const mongoose_1 = __importStar(require("mongoose"));
const orderSchema = new mongoose_1.Schema({
    orderId: {
        type: String,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String, required: true },
            slug: { type: String, required: true },
            sku: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            discountType: { type: String, required: true },
            discountPrice: { type: Number, required: true },
            product_image: { type: String },
            isCustomized: { type: Boolean, default: false },
            custom_data: { type: Object, default: null },
            _id: false,
        },
    ],
    totalAmount: {
        totalPrice: { type: Number, required: true },
        discountPrice: { type: Number, required: true },
        shippingTotal: { type: Number, required: true },
        coupon_discount: { type: Number },
    },
    payAmt: { type: Number, required: true },
    paymentType: { type: String, enum: ['online', 'offline'], required: true },
    payment: {
        method: { type: String },
        transactionId: { type: String },
        isPaid: { type: Boolean, default: false },
        paidAt: { type: Date },
        paymentPartner: { type: String },
    },
    offerId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Offer',
    },
    shipping: {
        userName: { type: String, required: true },
        addressLine: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postCode: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        email: { type: String, required: true, default: 'shivankarora87@gmail.com' },
    },
    shipment: {
        provider: { type: String },
        trackingId: { type: String },
        order_id: { type: String },
        height: { type: String },
        width: { type: String },
        length: { type: String },
        weight: { type: String },
    },
    coupon: {
        code: { type: String, default: '' },
        discountAmount: { type: Number, default: 0 },
        discountType: { type: String },
        isApplied: { type: Boolean, default: false },
    },
    totalQuantity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned', 'progress', 'refunded'],
        default: 'pending'
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    razorpayOrderId: { type: String },
}, { timestamps: true });
const Order = mongoose_1.default.models.Order || mongoose_1.default.model("Order", orderSchema);
exports.default = Order;
//# sourceMappingURL=orderModel.js.map