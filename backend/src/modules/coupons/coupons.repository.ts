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

  /* ─── Storefront active coupons (visible + non-expired only) ─── */
  storefrontActive: () => {
    const now = new Date();
    return Coupon.find({
      isActive: true,
      isShow: true,
      $and: [
        { $or: [{ validFrom: { $lte: now } }, { validFrom: null }] },
        { $or: [{ validUntil: { $gte: now } }, { validUntil: null }] },
        // usageLimit null (unlimited) ya usedCount < usageLimit
        { $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
      ],
    })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
  },

  /* ─── Mutations ─── */
  findById: (id: string) => Coupon.findById(id),
  // code se dhoondho (case-insensitive — model uppercase store karta hai)
  findByCode: (code: string) =>
    Coupon.findOne({ code: code.trim().toUpperCase() }),
  create: (data: Record<string, unknown>) => Coupon.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    Coupon.findByIdAndUpdate(id, patch, { new: true }),
  deleteById: (id: string) => Coupon.findByIdAndDelete(id),

  // Baaki sab coupons ka isDefault false karo (ek hi default reh sake)
  unsetAllDefaults: (exceptId?: string) =>
    Coupon.updateMany(
      exceptId ? { _id: { $ne: exceptId } } : {},
      { $set: { isDefault: false } }
    ),

  // Usage count badhao (usageLimit enforcement ke liye)
  incrementUsage: (id: string) =>
    Coupon.findByIdAndUpdate(id, { $inc: { usedCount: 1 } }, { new: true }),

  /* ─── Used by /apply — checks user's couponCollection ─── */
  findUserById: (userId: string) => User.findById(userId),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
