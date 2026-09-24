import { FilterQuery } from 'mongoose';
import User from '@/db/models/userModel';
import Order from '@/db/models/orderModel';
import Wishlist from '@/db/models/wishlistModel';
import Review from '@/db/models/reviewModel';
import { Address } from '@/db/models/addressModel';

export const usersRepo = {
  /* ─── admin list — search across username / email / number ─── */
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ users: unknown[]; total: number }> => {
    const query = buildSearchQuery(search);
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);
    return { users, total };
  },


  // allForExport: (search: string) => {
  //   const query = buildSearchQuery(search);
  //   return User.find(query).select('-password').sort({ createdAt: -1 }).lean();
  // },

  setBlockStatus: (userId: string, isBlocked: boolean) =>
    User.findByIdAndUpdate(userId, { isBlocked }, { new: true }).select('-password'),

  /* ─── all users (for Excel export) ─── */
  allForExport: (search: string) => {
    const query: FilterQuery<unknown> = { role: { $ne: 'admin' } };
    if (search) {
      (query as Record<string, unknown>).$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { number: { $regex: search, $options: 'i' } },
      ];
    }
    return User.find(query).select('-password').sort({ createdAt: -1 }).lean();
  },

  /* ─── single read / update ─── */
  findById: (id: string) => User.findById(id),
  findByIdLean: (id: string) => User.findById(id).select('-password').lean(),

  /* ─── full detail joins ─── */
  addressesByUser: (userId: string) =>
    Address.find({ userId }).sort({ createdAt: -1 }).lean(),
  ordersByUser: (userId: string) =>
    Order.find({ userId }).sort({ createdAt: -1 }).lean(),
  reviewsByUser: (userId: string) =>
    Review.find({ userId })
      .populate({ path: 'productId', select: 'title slug thumbnail' })
      .sort({ createdAt: -1 })
      .lean(),
  wishlistByUser: (userId: string) =>
    Wishlist.findOne({ userId }).populate('items.productId').lean(),

  /* ─── dashboard counters (unchanged) ─── */
  countOrdersByStatus: (userId: string, statuses: string[]): Promise<number> =>
    Order.countDocuments({ userId, status: { $in: statuses } }),
  countPendingOrders: (userId: string): Promise<number> =>
    Order.countDocuments({ userId, status: 'pending' }),
  sumOrderAmountByStatus: async (userId: string, statuses: string[]): Promise<number> => {
    const result = (await Order.aggregate([
      { $match: { userId, status: { $in: statuses } } },
      { $group: { _id: null, total: { $sum: '$payAmt' } } },
    ])) as Array<{ _id: null; total: number }>;
    return result[0]?.total ?? 0;
  },
  countWishlist: (userId: string): Promise<number> =>
    Wishlist.countDocuments({ userId }),
  countAddresses: (userId: string): Promise<number> =>
    Address.countDocuments({ userId }),
};
const buildSearchQuery = (search: string): FilterQuery<unknown> => {
  const query: FilterQuery<unknown> = { role: { $ne: 'admin' } };
  if (search) {
    (query as Record<string, unknown>).$or = [
      { username: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      // number is a Number field — convert to string before regex match
      {
        $expr: {
          $regexMatch: {
            input: { $toString: '$number' },
            regex: search,
            options: 'i',
          },
        },
      },
    ];
  }
  return query;
};