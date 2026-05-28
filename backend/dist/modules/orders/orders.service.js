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
exports.REVENUE_STATUSES = void 0;
exports.list = list;
exports.byId = byId;
exports.deleteOrder = deleteOrder;
exports.createOrder = createOrder;
exports.updateOrderShipping = updateOrderShipping;
exports.updateOrderStatus = updateOrderStatus;
/**
 * Orders service. Direct port of:
 *   src/app/api/order/route.ts                  GET (with reviews + revenue) + POST (create)
 *   src/app/api/order/[id]/route.ts             GET + DELETE
 *   src/app/api/order/[id]/pending/route.ts     GET (pending nav) + DELETE
 *   src/app/api/order/[id]/status/route.ts      PATCH (status with side-effects)
 *   src/app/api/order/[id]/shipping/route.ts    PATCH (shipping)
 *
 * Behaviour preserved exactly — including the IST day range filter,
 * the duplicate-address de-dup in POST, the per-item review attachment
 * by `${orderId}_${productId}`, the prev/next navigation lookups by
 * status group, the conditional Shiprocket cancel call, and the email
 * notifications on delivered / refunded transitions.
 */
const axios_1 = __importDefault(require("axios"));
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("@/utils/helpers");
const errors_1 = require("@/utils/errors");
const storage_1 = require("@/utils/storage");
const logger_1 = require("@/config/logger");
const auth_repository_1 = require("@/modules/auth/auth.repository");
const orders_repository_1 = require("./orders.repository");
const REVENUE_STATUSES = ['confirmed', 'shipped', 'delivered'];
exports.REVENUE_STATUSES = REVENUE_STATUSES;
/* ──────────────── 1. List orders (admin sees all non-pending unless filtered) ──────────────── */
async function list(user, q) {
    const query = {};
    if (user.role !== 'admin') {
        query.userId = new mongoose_1.default.Types.ObjectId(user.id);
    }
    else if (q.status && q.status !== 'all') {
        query.status = q.status;
    }
    else {
        query.status = { $ne: 'pending' };
    }
    if (q.search) {
        query.orderId = { $regex: q.search, $options: 'i' };
    }
    if (q.startDate || q.endDate) {
        const createdAt = {};
        if (q.startDate)
            createdAt.$gte = (0, helpers_1.getISTDayRange)(q.startDate).start;
        if (q.endDate)
            createdAt.$lte = (0, helpers_1.getISTDayRange)(q.endDate).end;
        query.createdAt = createdAt;
    }
    const { orders, total } = await orders_repository_1.ordersRepo.list(query, q.page, q.limit);
    // Collect product ids across all order items
    const productIds = orders
        .flatMap((o) => (o.items ?? []).map((i) => i.productId))
        .filter(Boolean);
    // Reviews lookup (admin sees all reviews, users only see their own)
    const reviews = await orders_repository_1.ordersRepo.findReviewsFor(productIds, user.role === 'admin' ? null : user.id);
    // Map of `${orderId}_${productId}` → review
    const reviewMap = new Map(reviews.map((r) => [`${String(r.orderId)}_${String(r.productId)}`, r]));
    const updatedOrders = orders.map((order) => {
        const items = (order.items ?? []).map((item) => {
            const key = `${String(order._id)}_${String(item.productId)}`;
            const review = reviewMap.get(key);
            return {
                ...item,
                review: review
                    ? {
                        reviewId: review._id,
                        rating: review.rating,
                        review: review.review,
                        userId: review.userId,
                    }
                    : null,
            };
        });
        return { ...order, items };
    });
    const revenue = await orders_repository_1.ordersRepo.revenue(query);
    return {
        success: true,
        orders: updatedOrders,
        revenue,
        pagination: {
            total,
            pages: Math.ceil(total / q.limit),
            page: q.page,
            limit: q.limit,
        },
    };
}
/* ──────────────── 2. Get one order — populated + prev/next nav ──────────────── */
async function byId(id, pending = false) {
    if (!orders_repository_1.ordersRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Order ID');
    const order = await orders_repository_1.ordersRepo.findByIdPopulated(id);
    if (!order)
        throw new errors_1.NotFoundError('Order not found');
    const { prev, next } = await orders_repository_1.ordersRepo.navAdjacent(order.createdAt, pending);
    return {
        success: true,
        data: {
            ...order,
            prevOrderId: prev?._id ?? null,
            nextOrderId: next?._id ?? null,
        },
    };
}
/* ──────────────── 3. Delete order (with custom-image cleanup) ──────────────── */
async function deleteOrder(id) {
    if (!orders_repository_1.ordersRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Order ID');
    const order = await orders_repository_1.ordersRepo.findById(id);
    if (!order)
        throw new errors_1.NotFoundError('Order not found');
    // Cleanup any uploaded custom-image assets from S3
    if (Array.isArray(order.items)) {
        for (const item of order.items) {
            const data = item.custom_data;
            if (!data)
                continue;
            for (const k of Object.keys(data)) {
                const v = data[k];
                if (v?.public_id) {
                    await (0, storage_1.deleteImage)(v.public_id).catch(() => undefined);
                }
            }
        }
    }
    await orders_repository_1.ordersRepo.deleteById(id);
    return { success: true, message: 'Order deleted successfully' };
}
/* ──────────────── 4. Create order ──────────────── */
async function createOrder(userId, body) {
    if (!mongoose_1.default.isValidObjectId(userId))
        throw new errors_1.UnauthorizedError();
    const user = await auth_repository_1.authRepo.findById(userId);
    if (!user)
        throw new errors_1.NotFoundError('User not found');
    // Backfill username/email if missing (matches original behaviour)
    const invalidUsernames = ['', 'user', 'guest'];
    if (invalidUsernames.includes(user.username ?? '')) {
        user.username = body.address.name || 'Guest';
    }
    if (!user.email && body.address.email)
        user.email = body.address.email;
    await user.save();
    if (!body.items || body.items.length === 0) {
        throw new errors_1.BadRequestError('No items in the order.');
    }
    /* ── Address: skip duplicates ───────────────────────── */
    const incoming = {
        fullName: body.address.name,
        mobileNumber: (0, helpers_1.normDigits)(body.address.number),
        email: body.address.email,
        addressLine: body.address.address,
        city: body.address.city,
        state: body.address.state,
        postCode: (0, helpers_1.normDigits)(body.address.postCode),
        addressType: body.address.addressType ?? 'home',
    };
    const existingAddresses = await orders_repository_1.ordersRepo.addressesByUser(userId);
    const duplicate = existingAddresses.find((a) => (0, helpers_1.norm)(a.addressLine) === (0, helpers_1.norm)(incoming.addressLine) &&
        (0, helpers_1.normDigits)(a.postCode) === incoming.postCode &&
        (0, helpers_1.normDigits)(a.mobileNumber) === incoming.mobileNumber &&
        (0, helpers_1.norm)(a.city) === (0, helpers_1.norm)(incoming.city));
    let addressData;
    if (duplicate) {
        addressData = duplicate;
    }
    else {
        const newAddr = await orders_repository_1.ordersRepo.createAddress({
            userId,
            fullName: incoming.fullName,
            mobileNumber: incoming.mobileNumber,
            email: incoming.email,
            addressLine: incoming.addressLine,
            city: incoming.city,
            state: incoming.state,
            postCode: incoming.postCode,
            addressType: incoming.addressType,
        });
        addressData = newAddr.toObject?.() ?? newAddr;
    }
    const itemData = await Promise.all(body.items.map(async (item) => {
        if (!item.custom_data) {
            return {
                productId: item.productId,
                name: item.name,
                slug: item.slug,
                quantity: item.quantity,
                sku: item.sku,
                product_image: item.product_image,
                price: item.price,
                discountType: item.discountType,
                discountPrice: item.discountPrice,
            };
        }
        const c = item.custom_data;
        const updatedProductData = {
            ...c,
            previewCanvas: c.previewCanvas &&
                (await (0, storage_1.uploadImageOrder)(c.previewCanvas, 'customized preview canvas')),
            previewImage: c.previewImage &&
                (await (0, storage_1.uploadImageOrder)(c.previewImage, 'customized image')),
            previewImageTwo: c.previewImageTwo &&
                (await (0, storage_1.uploadImageOrder)(c.previewImageTwo, 'customized image')),
            previewImageThree: c.previewImageThree &&
                (await (0, storage_1.uploadImageOrder)(c.previewImageThree, 'customized image')),
            previewImageFour: c.previewImageFour &&
                (await (0, storage_1.uploadImageOrder)(c.previewImageFour, 'customized image')),
        };
        let uploadedProductImage = item.product_image;
        if (typeof item.product_image === 'string' &&
            item.product_image.startsWith('data:image')) {
            const up = await (0, storage_1.uploadImageOrder)(item.product_image, 'customized image');
            uploadedProductImage = up?.url || item.product_image;
        }
        return {
            productId: item.productId,
            name: item.name,
            slug: item.slug,
            quantity: item.quantity,
            sku: item.sku,
            product_image: uploadedProductImage,
            isCustomized: true,
            custom_data: updatedProductData,
            price: item.price,
            discountType: item.discountType,
            discountPrice: item.discountPrice,
        };
    }));
    const timestamp = Date.now();
    const payAmtNum = Number(body.payAmt);
    const payAmt = body.paymentMethod === 'online'
        ? payAmtNum.toFixed(2)
        : (payAmtNum * 0.2).toFixed(2);
    const orderData = {
        orderId: `ORD-${timestamp}`,
        items: itemData,
        totalAmount: {
            totalPrice: body.totalPrice.totalPrice,
            discountPrice: body.totalPrice.discountPrice,
            shippingTotal: body.totalPrice.shippingTotal,
            coupon_discount: body.totalPrice.coupon_discount,
        },
        payAmt,
        paymentType: body.paymentMethod,
        payment: {
            method: body.paymentMethod,
            transactionId: '',
            isPaid: false,
            paidAt: null,
            paymentPartner: body.paymentPartner || 'phonepe',
        },
        offerId: null,
        shipping: {
            userName: addressData.fullName,
            addressLine: addressData.addressLine,
            city: addressData.city,
            state: addressData.state,
            postCode: addressData.postCode,
            mobileNumber: addressData.mobileNumber,
            email: user.email,
        },
        coupon: {
            code: body.coupon?.code || '',
            discountAmount: body.coupon?.discountAmount || 0,
            discountType: body.coupon?.discountType || '',
            isApplied: body.coupon?.isApplied || false,
        },
        totalQuantity: body.getTotalItems || 0,
        status: 'pending',
        userId,
    };
    const order = await orders_repository_1.ordersRepo.create(orderData);
    return {
        success: true,
        message: 'Order saved successfully',
        order: {
            ...(order._doc ??
                order),
            user,
        },
    };
}
/* ──────────────── 5. Patch shipping ──────────────── */
async function updateOrderShipping(id, body) {
    if (!orders_repository_1.ordersRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Order ID');
    const updateData = {};
    if (body.shipping) {
        updateData.shipping = {
            userName: body.shipping.userName,
            mobileNumber: body.shipping.mobileNumber,
            email: body.shipping.email,
            addressLine: body.shipping.addressLine,
            city: body.shipping.city,
            state: body.shipping.state,
            postCode: body.shipping.postCode,
        };
    }
    if (Object.keys(updateData).length === 0) {
        throw new errors_1.BadRequestError('No update data provided');
    }
    const updated = await orders_repository_1.ordersRepo.updateById(id, { $set: updateData });
    if (!updated)
        throw new errors_1.NotFoundError('Order not found');
    return { success: true, message: 'Order updated successfully', data: updated };
}
/* ──────────────── 6. Patch status (with side-effects) ──────────────── */
async function updateOrderStatus(id, body) {
    if (!body.status)
        throw new errors_1.BadRequestError('Status is required');
    const existing = await orders_repository_1.ordersRepo.findById(id);
    if (!existing)
        throw new errors_1.NotFoundError('Order not found');
    const order = await orders_repository_1.ordersRepo.updateById(id, { status: body.status });
    if (!order)
        throw new errors_1.NotFoundError('Order not found');
    // Side-effects: cancel via fship API + email notifications
    if (body.status === 'cancelled' && order.shipment?.order_id) {
        try {
            const token = (0, helpers_1.fshipToken)();
            await axios_1.default.post('https://capi.fship.in/api/CancelOrder', JSON.stringify({
                reason: 'Cancellation requested by user',
                waybill: order.shipment.trackingId,
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
        }
        catch (err) {
            logger_1.logger.error('Error cancelling Shiprocket/fship order', err);
        }
    }
    // Email notifications — lazy-load mailer to keep boot time tight
    try {
        const mailer = (await Promise.resolve().then(() => __importStar(require('@/utils/mail/mailer'))));
        if (body.status === 'delivered') {
            await mailer.sendDeliveredWithRatingMessage?.(order);
        }
        else if (body.status !== 'shipped') {
            await mailer.sendOrderStatus?.(order);
        }
        if (body.status === 'refunded' && body.refundReason) {
            await mailer.sendRtoMessage?.(order, body.refundReason);
        }
    }
    catch (err) {
        logger_1.logger.error('Order status notification failed', err);
    }
    return { success: true, message: 'Order updated successfully', data: order };
}
//# sourceMappingURL=orders.service.js.map