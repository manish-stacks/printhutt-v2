import { FilterQuery } from 'mongoose';
import User from '@/db/models/userModel';
import Order from '@/db/models/orderModel';
import Wishlist from '@/db/models/wishlistModel';
import { Address } from '@/db/models/addressModel';

/**
 * Users repository.
 * Used by the admin user listing and the v1 user-dashboard aggregations.
 */
export const usersRepo = {
  /* ─── admin list — page + search, excluding role:admin ─── */
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ users: unknown[]; total: number }> => {
    const query: FilterQuery<unknown> = { role: { $ne: 'admin' } };
    if (search) {
      (query as Record<string, unknown>).username = {
        $regex: search,
        $options: 'i',
      };
    }
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);
    return { users, total };
  },

  /* ─── single read / update ─── */
  findById: (id: string) => User.findById(id),

  /* ─── dashboard counters for /api/v1/user ─── */
  countOrdersByStatus: (userId: string, statuses: string[]): Promise<number> =>
    Order.countDocuments({ userId, status: { $in: statuses } }),

  countPendingOrders: (userId: string): Promise<number> =>
    Order.countDocuments({ userId, status: 'pending' }),

  sumOrderAmountByStatus: async (
    userId: string,
    statuses: string[]
  ): Promise<number> => {
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
