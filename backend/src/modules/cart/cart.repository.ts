import SessionCart from '@/db/models/session_carts.model';
import Product from '@/db/models/productModel';

export const cartRepo = {
  /* ─── Append a session-cart entry (analytics for guest sessions) ─── */
  add: (productId: string) =>
    SessionCart.create({ productId }),

  /* ─── Recent session-cart entries, joined with product details ─── */
  listRecent: () =>
    SessionCart.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'productId', model: Product })
      .lean(),
};
