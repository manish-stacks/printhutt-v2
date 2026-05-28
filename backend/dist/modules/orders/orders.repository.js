"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ordersRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const orderModel_1 = __importDefault(require("@/db/models/orderModel"));
const productModel_1 = __importDefault(require("@/db/models/productModel"));
const reviewModel_1 = __importDefault(require("@/db/models/reviewModel"));
const addressModel_1 = require("@/db/models/addressModel");
const VALID_REVENUE_STATUS = ['confirmed', 'shipped', 'delivered'];
const NAV_STATUSES_DEFAULT = [
    'confirmed',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
    'progress',
    'refunded',
];
const NAV_STATUSES_PENDING = ['pending'];
exports.ordersRepo = {
    /* ─── List orders (paginated) ─── */
    list: async (query, page, limit) => {
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            orderModel_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            orderModel_1.default.countDocuments(query),
        ]);
        return { orders, total };
    },
    /* ─── Reviews for a set of product ids (used to attach to order items) ─── */
    findReviewsFor: (productIds, userId) => {
        const reviewQuery = {
            productId: { $in: productIds },
        };
        if (userId)
            reviewQuery.userId = userId;
        return reviewModel_1.default.find(reviewQuery)
            .select('productId orderId rating review userId _id')
            .lean();
    },
    /* ─── Revenue aggregate (filtered by the same admin query) ─── */
    revenue: async (baseQuery) => {
        const result = (await orderModel_1.default.aggregate([
            {
                $match: {
                    ...baseQuery,
                    status: { $in: [...VALID_REVENUE_STATUS] },
                },
            },
            {
                $group: {
                    _id: null,
                    value: {
                        $sum: {
                            $subtract: [
                                {
                                    $add: [
                                        { $ifNull: ['$totalAmount.discountPrice', 0] },
                                        { $ifNull: ['$totalAmount.shippingTotal', 0] },
                                    ],
                                },
                                { $ifNull: ['$totalAmount.coupon_discount', 0] },
                            ],
                        },
                    },
                },
            },
        ]));
        return result[0]?.value ?? 0;
    },
    /* ─── Single order with product populated ─── */
    findByIdPopulated: (id) => orderModel_1.default.findById(id).populate({ path: 'items.productId', model: productModel_1.default }).lean(),
    findById: (id) => orderModel_1.default.findById(id),
    /* ─── Prev/Next navigation among non-pending statuses ─── */
    navAdjacent: async (createdAt, pending) => {
        const statuses = pending ? [...NAV_STATUSES_PENDING] : [...NAV_STATUSES_DEFAULT];
        const [prev, next] = await Promise.all([
            orderModel_1.default.findOne({ createdAt: { $lt: createdAt }, status: { $in: statuses } })
                .sort({ createdAt: -1 })
                .select('_id')
                .lean(),
            orderModel_1.default.findOne({ createdAt: { $gt: createdAt }, status: { $in: statuses } })
                .sort({ createdAt: 1 })
                .select('_id')
                .lean(),
        ]);
        return { prev, next };
    },
    /* ─── Address de-dup helpers (used by POST) ─── */
    addressesByUser: (userId) => addressModel_1.Address.find({ userId }).lean(),
    createAddress: (data) => addressModel_1.Address.create(data),
    /* ─── Mutations ─── */
    create: (data) => orderModel_1.default.create(data),
    updateById: (id, patch) => orderModel_1.default.findByIdAndUpdate(id, patch, { new: true }),
    deleteById: (id) => orderModel_1.default.findByIdAndDelete(id),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=orders.repository.js.map