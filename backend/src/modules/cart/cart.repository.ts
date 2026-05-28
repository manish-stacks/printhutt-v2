import SessionCart from '@/db/models/session_carts.model';
import Product from '@/db/models/productModel';

export const cartRepo = {
  /* ─── Append a session-cart entry ─── */
  add: (productId: string) => SessionCart.create({ productId }),

  /* ─── Recent (unchanged — for storefront/other callers) ─── */
  listRecent: () =>
    SessionCart.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'productId', model: Product })
      .lean(),

  /* ─── Paginated list (admin) ─── */
  listPaginated: async (
    page: number,
    limit: number
  ): Promise<{ items: unknown[]; total: number }> => {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      SessionCart.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'productId', model: Product })
        .lean(),
      SessionCart.countDocuments(),
    ]);
    return { items, total };
  },

  /* ─── Bulk delete by ids ─── */
  bulkDelete: (ids: string[]) =>
    SessionCart.deleteMany({ _id: { $in: ids } }),
};