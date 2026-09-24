import { BadRequestError } from '@/utils/errors';
import { cartRepo } from './cart.repository';

export async function addToSessionCart(productId: string): Promise<void> {
  if (!productId) throw new BadRequestError('Invalid product ID');
  await cartRepo.add(productId);
}

export async function recentSessionCart(): Promise<unknown[]> {
  return cartRepo.listRecent();
}

/* ─── Admin: paginated list ─── */
export async function listPaginated(page: number, limit: number): Promise<unknown> {
  const { items, total } = await cartRepo.listPaginated(page, limit);
  return {
    success: true,
    data: items,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
  };
}

/* ─── Admin: bulk delete ─── */
export async function bulkDelete(ids: string[]): Promise<{ deletedCount: number }> {
  const result = await cartRepo.bulkDelete(ids);
  return { deletedCount: result.deletedCount ?? 0 };
}