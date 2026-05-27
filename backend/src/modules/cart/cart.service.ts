/**
 * Cart (session-cart) service. Direct port of:
 *   src/app/api/session-cart/route.ts   POST + GET
 *
 * The original endpoint records add-to-cart events (for analytics) and
 * returns the recent additions populated with the product. Behaviour
 * preserved exactly — including the 204 No Content when there are no
 * recent entries (handled in the controller).
 */
import { BadRequestError } from '@/utils/errors';
import { cartRepo } from './cart.repository';

export async function addToSessionCart(productId: string): Promise<void> {
  if (!productId) throw new BadRequestError('Invalid product ID');
  await cartRepo.add(productId);
}

export async function recentSessionCart(): Promise<unknown[]> {
  return cartRepo.listRecent();
}
