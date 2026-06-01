import { BadRequestError, NotFoundError } from '@/utils/errors';
import { wishlistRepo } from './wishlist.repository';
import Wishlist from '@/db/models/wishlistModel';
import { Types } from 'mongoose';

/* ──────────────── 1. Add to wishlist ──────────────── */
export async function addToWishlist(
  userId: string,
  productId: string
): Promise<{ alreadyExists: boolean }> {
  let wishlist = await wishlistRepo.findByUser(userId);

  if (!wishlist) {
    await wishlistRepo.createForUser(userId, productId);
    return { alreadyExists: false };
  }

  const exists = await wishlistRepo.hasProduct(userId, productId);
  if (exists) return { alreadyExists: true };

  await wishlistRepo.addProduct(userId, productId);
  return { alreadyExists: false };
}

/* ──────────────── 2. Get wishlist (logged-in or anonymous) ──────────────── */
export async function getWishlist(userId: string | null): Promise<{
  loggedIn: boolean;
  data: unknown;
}> {
  if (!userId) return { loggedIn: false, data: [] };
  const wishlist = await wishlistRepo.findByUserPopulated(userId);
  return { loggedIn: true, data: wishlist };
}

/* ──────────────── 3. Remove from wishlist ──────────────── */
export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<void> {
  if (!wishlistRepo.isValidObjectId(productId)) {
    throw new BadRequestError('Invalid ID');
  }

  const wishlist = await wishlistRepo.findByUser(userId);
  if (!wishlist) throw new NotFoundError('Product not found in wishlist');

  // Filter out the matching product
  wishlist.items = wishlist.items.filter(
    (item: { productId: { toString(): string } }) =>
      item.productId.toString() !== productId
  );
  await wishlist.save();
}

/* GET /api/wishlist/admin/all — list all wishlists with user + product details */
export async function adminListAll(opts: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<unknown> {
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(100, opts.limit || 20);

  // First get all unique users with wishlists
  const matchStage: any = {};
  const userMatch: any = {};
  if (opts.search) {
    userMatch.$or = [
      { username: { $regex: opts.search, $options: 'i' } },
      { email: { $regex: opts.search, $options: 'i' } },
      { number: { $regex: opts.search, $options: 'i' } },
    ];
  }

  const aggregate = await Wishlist.aggregate([
    // Group by user, get latest wishlist info
    {
      $group: {
        _id: '$userId',
        items: { $push: '$$ROOT' },
        itemCount: { $sum: 1 },
        lastAdded: { $max: '$createdAt' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    ...(Object.keys(userMatch).length ? [{ $match: { user: userMatch.$or ? { $or: userMatch.$or.map((c: any) => Object.fromEntries(Object.entries(c).map(([k, v]) => [`user.${k.replace('user.', '')}`, v]))) } : userMatch } }] : []),
    {
      $project: {
        userId: '$_id',
        userName: '$user.username',
        userEmail: '$user.email',
        userNumber: '$user.number',
        itemCount: 1,
        lastAdded: 1,
      },
    },
    { $sort: { lastAdded: -1 } },
    {
      $facet: {
        meta: [{ $count: 'total' }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
  ]);

  const result = aggregate[0];
  return {
    success: true,
    total: result.meta[0]?.total || 0,
    page,
    limit,
    data: result.data,
  };
}

/* GET /api/wishlist/admin/user/:userId — single user's full wishlist with product info */
export async function adminGetUserWishlist(userId: string): Promise<unknown> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new BadRequestError('Invalid userId');
  }

  const items = await Wishlist.find({ userId })
    .populate({
      path: 'productId',
      select: 'title slug price thumbnail discountPrice discountType',
    })
    .sort({ createdAt: -1 })
    .lean();

  return { success: true, items };
}