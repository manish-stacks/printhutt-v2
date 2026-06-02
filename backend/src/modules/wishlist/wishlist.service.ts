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


/* GET /api/wishlist/admin/all */
export async function adminListAll(opts: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<unknown> {
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(100, opts.limit || 20);
  const search = opts.search?.trim();

  const pipeline: any[] = [
    // Only docs with items
    { $match: { 'items.0': { $exists: true } } },

    // Join user
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ];

  // Search filter
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { 'user.username': { $regex: search, $options: 'i' } },
          { 'user.email': { $regex: search, $options: 'i' } },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: { $ifNull: ['$user.number', ''] } },
                regex: search,
                options: 'i',
              },
            },
          },
        ],
      },
    });
  }

  // Project fields
  pipeline.push({
    $project: {
      _id: 0,
      userId: '$userId',
      userName: '$user.username',
      userEmail: '$user.email',
      userNumber: '$user.number',
      itemCount: { $size: { $ifNull: ['$items', []] } },
      lastAdded: '$updatedAt',
    },
  });

  // Sort + paginate
  pipeline.push({ $sort: { lastAdded: -1 } });
  pipeline.push({
    $facet: {
      meta: [{ $count: 'total' }],
      data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
    },
  });

  const result = await Wishlist.aggregate(pipeline);
  const out = result[0];

  return {
    success: true,
    total: out.meta[0]?.total || 0,
    page,
    limit,
    data: out.data,
  };
}

/* GET /api/wishlist/admin/user/:userId */
export async function adminGetUserWishlist(userId: string): Promise<unknown> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new BadRequestError('Invalid userId');
  }

  // Nested populate — items.productId
  const wishlist = await Wishlist.findOne({ userId })
    .populate({
      path: 'items.productId',
      select: 'title slug price thumbnail discountPrice discountType',
    })
    .lean();

  if (!wishlist) {
    return { success: true, items: [] };
  }

  // Sort items by addedAt desc
  const items = (
    (wishlist as { items?: any[] })?.items || []
  ).sort((a, b) => {
    const ta = new Date(a.addedAt).getTime();
    const tb = new Date(b.addedAt).getTime();
    return tb - ta;
  });

  return { success: true, items };
}