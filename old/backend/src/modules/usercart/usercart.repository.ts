import UserCart from '@/db/models/userCartModel';
import Product from '@/db/models/productModel';

export const userCartRepo = {
  findByUser: (userId: string) => UserCart.findOne({ userId }),

  findByUserPopulated: (userId: string) =>
    UserCart.findOne({ userId })
      .populate({ path: 'items.productId', model: Product })
      .lean(),

  createForUser: (userId: string, items: unknown[]) =>
    UserCart.create({ userId, items }),

  save: (cart: { save: () => Promise<unknown> }) => cart.save(),

  clear: (userId: string) =>
    UserCart.findOneAndUpdate({ userId }, { items: [] }, { new: true }),
};