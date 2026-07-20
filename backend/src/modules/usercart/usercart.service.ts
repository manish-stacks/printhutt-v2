import { BadRequestError, NotFoundError } from '@/utils/errors';
import { userCartRepo } from './usercart.repository';
import type { AddItemDTO, MergeDTO } from './usercart.validation';
import { Types } from 'mongoose';
import UserCart from '@/db/models/userCartModel';
import { logger } from '@/config/logger';

const MAX_ITEM_SIZE_BYTES = 500 * 1024; // 500KB per item

/* Same item check — productId + variantId + size match */
const sameItem = (
  a: { productId: { toString(): string }; variantId?: string; size?: string },
  productId: string,
  variantId?: string,
  size?: string
): boolean =>
  a.productId.toString() === productId &&
  (a.variantId ?? '') === (variantId ?? '') &&
  (a.size ?? '') === (size ?? '');

export async function getCart(userId: string): Promise<unknown> {
  const cart = await userCartRepo.findByUserPopulated(userId);
  return { success: true, items: cart?.items ?? [] };
}

export async function addItem(userId: string, body: AddItemDTO): Promise<unknown> {
  let cart = await userCartRepo.findByUser(userId);

  if (!cart) {
    cart = await userCartRepo.createForUser(userId, [body]);
    return { success: true, message: 'Added to cart', items: cart.items };
  }

  const existing = cart.items.find((i) =>
    sameItem(i, body.productId, body.variantId, body.size)
  );

  // Customization wale items hamesha naya entry (kyunki har ek alag)
  const hasCustom = body.custom_data && Object.keys(body.custom_data).length > 0;

  if (existing && !hasCustom) {
    existing.quantity += body.quantity;
  } else {
    cart.items.push(body as never);
  }
  await cart.save();
  return { success: true, message: 'Added to cart', items: cart.items };
}

export async function updateQty(
  userId: string,
  itemId: string,
  quantity: number
): Promise<unknown> {
  const cart = await userCartRepo.findByUser(userId);
  if (!cart) throw new NotFoundError('Cart not found');

  const item = (cart.items as unknown as Types.DocumentArray<any>).id(itemId);
  if (!item) throw new NotFoundError('Item not found in cart');
  item.quantity = quantity;
  await cart.save();
  return { success: true, message: 'Quantity updated', items: cart.items };
}

export async function removeItem(userId: string, itemId: string): Promise<unknown> {
  const cart = await userCartRepo.findByUser(userId);
  if (!cart) throw new NotFoundError('Cart not found');
  const item = (cart.items as unknown as Types.DocumentArray<any>).id(itemId);
  if (!item) throw new NotFoundError('Item not found in cart');
  item.deleteOne();
  await cart.save();
  return { success: true, message: 'Item removed', items: cart.items };
}

export async function clearCart(userId: string): Promise<unknown> {
  await userCartRepo.clear(userId);
  return { success: true, message: 'Cart cleared', items: [] };
}

/* Guest cart → DB merge (login ke baad) */
export async function mergeCart(userId: string, body: MergeDTO): Promise<unknown> {
  let cart = await userCartRepo.findByUser(userId);
  if (!cart) {
    cart = await userCartRepo.createForUser(userId, []);
  }

  for (const incoming of body.items) {
    // ✅ FIX 1: Gift items kabhi DB mein save mat karo
    if ((incoming as any).isGift) continue;

    const hasCustom =
      incoming.custom_data && Object.keys(incoming.custom_data).length > 0;

    const existing = cart.items.find((i) =>
      sameItem(i, incoming.productId, incoming.variantId, incoming.size)
    );

    if (existing && !hasCustom) {
      // ✅ FIX 2: Quantity add nahi, MAX lo — avoid double counting
      // Guest mein 2 tha, DB mein bhi 2 tha → result 2 hona chahiye, 4 nahi
      existing.quantity = Math.max(existing.quantity, incoming.quantity);
    } else if (!existing) {
      cart.items.push(incoming as never);
    }
    // existing + hasCustom = skip (custom items already separate hain)
  }
  await cart.save();

  const populated = await userCartRepo.findByUserPopulated(userId);
  return { success: true, message: 'Cart merged', items: populated?.items ?? [] };
}

export async function syncCart(userId: string, items: MergeDTO['items']): Promise<unknown> {
  const cleanItems = (items || []).map(sanitizeCartItem) as MergeDTO['items'];

  const totalSize = new TextEncoder().encode(JSON.stringify(cleanItems)).length;
  logger.info('[usercart] syncCart', {
    userId,
    itemCount: cleanItems.length,
    sizeKB: Math.round(totalSize / 1024),
  });

  let cart = await userCartRepo.findByUser(userId);
  if (!cart) {
    cart = await userCartRepo.createForUser(userId, cleanItems);
  } else {
    cart.items = cleanItems as never;
    await cart.save();
  }
  const populated = await userCartRepo.findByUserPopulated(userId);
  return { success: true, message: 'Cart synced', items: populated?.items ?? [] };
}

export async function adminListAll(opts: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<unknown> {
  const page = Math.max(1, opts.page || 1);
  const limit = Math.min(100, opts.limit || 20);
  const search = opts.search?.trim();

  const pipeline: any[] = [
    { $match: { 'items.0': { $exists: true } } },
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

  pipeline.push({
    $project: {
      _id: 0,
      userId: '$userId',
      userName: '$user.username',
      userEmail: '$user.email',
      userNumber: '$user.number',
      itemCount: { $size: { $ifNull: ['$items', []] } },
      totalQuantity: {
        $sum: {
          $map: {
            input: { $ifNull: ['$items', []] },
            as: 'i',
            in: { $ifNull: ['$$i.quantity', 0] },
          },
        },
      },
      totalValue: {
        $sum: {
          $map: {
            input: { $ifNull: ['$items', []] },
            as: 'i',
            in: {
              $multiply: [
                { $ifNull: ['$$i.price', 0] },
                { $ifNull: ['$$i.quantity', 0] },
              ],
            },
          },
        },
      },
      lastUpdated: '$updatedAt',
    },
  });

  pipeline.push({ $sort: { lastUpdated: -1 } });
  pipeline.push({
    $facet: {
      meta: [{ $count: 'total' }],
      data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
    },
  });

  const result = await UserCart.aggregate(pipeline);
  const out = result[0];

  return {
    success: true,
    total: out.meta[0]?.total || 0,
    page,
    limit,
    data: out.data,
  };
}

/* GET /api/usercart/admin/user/:userId */
export async function adminGetUserCart(userId: string): Promise<unknown> {
  if (!Types.ObjectId.isValid(userId)) {
    throw new BadRequestError('Invalid userId');
  }

  const cart = await UserCart.findOne({ userId })
    .populate({
      path: 'items.productId',
      select: 'title slug price thumbnail discountPrice discountType',
    })
    .lean();

  if (!cart) {
    return { success: true, items: [] };
  }

  return { success: true, items: cart.items || [] };
}




/* Strip base64 image strings from custom_data — MongoDB 16MB safety */
function sanitizeCartItem(item: any): any {
  if (!item) return item;
  const out = { ...item };

  if (out.custom_data && typeof out.custom_data === 'object') {
    const cd: Record<string, any> = { ...out.custom_data };
    let stripped = false;

    for (const key of Object.keys(cd)) {
      const val = cd[key];
      if (typeof val === 'string' && val.startsWith('data:image/')) {
        // Base64 image found — strip it (interceptor ko URL bana dena tha)
        delete cd[key];
        stripped = true;
      } else if (Array.isArray(val) && val.some((v) => typeof v === 'string' && v.startsWith('data:image/'))) {
        // e.g. customImages: [base64...] — sirf base64 entries strip, url wale rakho
        cd[key] = val.filter((v) => !(typeof v === 'string' && v.startsWith('data:image/')));
        stripped = true;
      }
    }

    if (stripped) {
      cd._stripped_base64 = true;
      cd._stripped_at = new Date().toISOString();
      logger.warn('[usercart] stripped base64 from custom_data', {
        productId: out.productId,
        keys: Object.keys(item.custom_data || {}),
      });
    }

    out.custom_data = cd;
  }

  // Size check per item (final safety)
  const itemSize = new TextEncoder().encode(JSON.stringify(out)).length;
  if (itemSize > MAX_ITEM_SIZE_BYTES) {
    logger.warn('[usercart] item still oversized after strip', {
      productId: out.productId,
      size: itemSize,
    });
    // Strip entire custom_data if still big
    out.custom_data = { _oversized_stripped: true };
  }

  return out;
}

function sanitizeItems(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  return items.map(sanitizeCartItem);
}