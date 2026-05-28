"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderShippingSchema = exports.updateOrderStatusSchema = exports.createOrderSchema = exports.listOrdersQuerySchema = void 0;
const zod_1 = require("zod");
/* ─────────── GET /api/orders ─────────── */
exports.listOrdersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
    status: zod_1.z.string().default(''),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
/* ─────────── POST /api/orders  (create) ─────────── */
const orderItemSchema = zod_1.z
    .object({
    productId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    slug: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().positive(),
    sku: zod_1.z.string().optional(),
    product_image: zod_1.z.unknown().optional(),
    price: zod_1.z.number().nonnegative(),
    discountType: zod_1.z.string().optional(),
    discountPrice: zod_1.z.number().optional(),
    custom_data: zod_1.z.unknown().optional(),
})
    .passthrough();
exports.createOrderSchema = zod_1.z.object({
    items: zod_1.z.array(orderItemSchema).min(1, 'No items in the order.'),
    address: zod_1.z
        .object({
        name: zod_1.z.string().min(1),
        email: zod_1.z.string().email().optional(),
        number: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
        address: zod_1.z.string().min(1),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(1),
        postCode: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
        addressType: zod_1.z.string().optional(),
    })
        .passthrough(),
    totalPrice: zod_1.z
        .object({
        totalPrice: zod_1.z.number(),
        discountPrice: zod_1.z.number(),
        shippingTotal: zod_1.z.number(),
        coupon_discount: zod_1.z.number().optional(),
    })
        .passthrough(),
    payAmt: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    paymentMethod: zod_1.z.string().min(1),
    paymentPartner: zod_1.z.string().optional(),
    coupon: zod_1.z
        .object({
        code: zod_1.z.string().optional(),
        discountAmount: zod_1.z.number().optional(),
        discountType: zod_1.z.string().optional(),
        isApplied: zod_1.z.boolean().optional(),
    })
        .optional(),
    getTotalItems: zod_1.z.number().optional(),
});
/* ─────────── PATCH /api/orders/:id/status ─────────── */
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.string().min(1, 'Status is required'),
    refundReason: zod_1.z.string().optional(),
});
/* ─────────── PATCH /api/orders/:id/shipping ─────────── */
exports.updateOrderShippingSchema = zod_1.z.object({
    shipping: zod_1.z
        .object({
        userName: zod_1.z.string().optional(),
        mobileNumber: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
        email: zod_1.z.string().optional(),
        addressLine: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state: zod_1.z.string().optional(),
        postCode: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    })
        .passthrough(),
});
//# sourceMappingURL=orders.validation.js.map