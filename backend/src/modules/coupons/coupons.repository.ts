import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import Coupon from '@/db/models/couponModel';
import User from '@/db/models/userModel';

export const couponsRepo = {
  /* ─── Admin paginated list ─── */
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ coupons: unknown[]; total: number }> => {
    const query: FilterQuery<unknown> = search
      ? { code: { $regex: search, $options: 'i' } }
      : {};
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(query),
    ]);
    return { coupons, total };
  },

  /* ─── Storefront active coupons (visible only) ─── */
  storefrontActive: () =>
    Coupon.find({ isActive: true, isShow: true })
      .sort({ createdAt: -1 })
      .lean(),

  /* ─── Mutations ─── */
  findById: (id: string) => Coupon.findById(id),
  create: (data: Record<string, unknown>) => Coupon.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    Coupon.findByIdAndUpdate(id, patch, { new: true }),
  deleteById: (id: string) => Coupon.findByIdAndDelete(id),

  /* ─── Used by /apply — checks user's couponCollection ─── */
  findUserById: (userId: string) => User.findById(userId),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
