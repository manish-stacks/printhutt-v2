import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import Order from '@/db/models/orderModel';
import Product from '@/db/models/productModel';
import Review from '@/db/models/reviewModel';
import User from '@/db/models/userModel';
import { Address } from '@/db/models/addressModel';

const VALID_REVENUE_STATUS = ['confirmed', 'shipped', 'delivered'] as const;
const NAV_STATUSES_DEFAULT = [
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
  'progress',
  'refunded',
] as const;
const NAV_STATUSES_PENDING = ['pending'] as const;

export const ordersRepo = {
  /* ─── List orders (paginated) ─── */
  list: async (
    query: FilterQuery<unknown>,
    page: number,
    limit: number
  ): Promise<{ orders: Array<Record<string, unknown>>; total: number }> => {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<Array<Record<string, unknown>>>(),
      Order.countDocuments(query),
    ]);
    return { orders, total };
  },

  /* ─── Reviews for a set of product ids (used to attach to order items) ─── */
  findReviewsFor: (
    productIds: unknown[],
    userId: string | null
  ) => {
    const reviewQuery: FilterQuery<unknown> = {
      productId: { $in: productIds },
    };
    if (userId) (reviewQuery as Record<string, unknown>).userId = userId;
    return Review.find(reviewQuery)
      .select('productId orderId rating review userId _id')
      .lean<Array<{
        _id: unknown;
        productId: unknown;
        orderId: unknown;
        userId: unknown;
        rating: number;
        review: string;
      }>>();
  },

  /* ─── Revenue aggregate (filtered by the same admin query) ─── */
  revenue: async (baseQuery: FilterQuery<unknown>): Promise<number> => {
    const result = (await Order.aggregate([
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
                    { $ifNull: ['$totalAmount.coupon_discount', 0] },
                  ],
                },
                { $ifNull: ['$totalAmount.coupon_discount', 0] },
              ],
            },
          },
        },
      },
    ])) as Array<{ _id: null; value: number }>;
    return result[0]?.value ?? 0;
  },

  /* ─── Single order with product populated ─── */
  findByIdPopulated: (id: string) =>
    Order.findById(id).populate({ path: 'items.productId', model: Product }).lean<Record<string, unknown> | null>(),

  findById: (id: string) => Order.findById(id),

  /* ─── Prev/Next navigation among non-pending statuses ─── */
  navAdjacent: async (
    createdAt: Date,
    pending: boolean
  ): Promise<{ prev: { _id: unknown } | null; next: { _id: unknown } | null }> => {
    const statuses = pending ? [...NAV_STATUSES_PENDING] : [...NAV_STATUSES_DEFAULT];
    const [prev, next] = await Promise.all([
      Order.findOne({ createdAt: { $lt: createdAt }, status: { $in: statuses } })
        .sort({ createdAt: -1 })
        .select('_id')
        .lean<{ _id: unknown } | null>(),
      Order.findOne({ createdAt: { $gt: createdAt }, status: { $in: statuses } })
        .sort({ createdAt: 1 })
        .select('_id')
        .lean<{ _id: unknown } | null>(),
    ]);
    return { prev, next };
  },

  /* ─── Address de-dup helpers (used by POST) ─── */
  addressesByUser: (userId: string) =>
    Address.find({ userId }).lean<Array<Record<string, unknown>>>(),

  createAddress: (data: Record<string, unknown>) => Address.create(data),

  /* ─── Mutations ─── */
  create: (data: Record<string, unknown>) => Order.create(data),

  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    Order.findByIdAndUpdate(id, patch, { new: true }),

  deleteById: (id: string) => Order.findByIdAndDelete(id),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),

  /** Export: sab matching orders (paging nahi, user populated) */
  allForExport: (query: FilterQuery<unknown>, limit: number) =>
    Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'userId', model: User, select: 'displayName username email number' })
      .lean<Array<Record<string, unknown>>>(),

  /** Count pending orders in date range (for preview) */
  countPendingInRange: (startDate: Date, endDate: Date) =>
    Order.countDocuments(buildPendingDateQuery(startDate, endDate)),

  /** Find pending orders in date range (with items for S3 cleanup) */
  findPendingInRange: (startDate: Date, endDate: Date) =>
    Order.find(buildPendingDateQuery(startDate, endDate))
      .select('_id orderId items createdAt')
      .lean(),

  /** Bulk delete pending orders in date range */
  deletePendingInRange: (startDate: Date, endDate: Date) =>
    Order.deleteMany(buildPendingDateQuery(startDate, endDate)),
};


const buildPendingDateQuery = (startDate: Date, endDate: Date): FilterQuery<unknown> => ({
  status: 'pending',
  createdAt: { $gte: startDate, $lte: endDate },
});