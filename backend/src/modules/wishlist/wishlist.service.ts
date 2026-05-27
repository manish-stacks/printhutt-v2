/**
 * Wishlist service. Direct port of:
 *   src/app/api/v1/wishlist/route.ts        POST + GET
 *   src/app/api/v1/wishlist/[id]/route.ts   DELETE
 *
 * Behaviour preserved exactly — including the "soft" response when the
 * GET endpoint is called without a session (returns success:false +
 * data:[] with HTTP 200 instead of 401, so the frontend can treat an
 * anonymous wishlist as empty without UX errors).
 */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { wishlistRepo } from './wishlist.repository';

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
