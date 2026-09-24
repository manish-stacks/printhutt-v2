import mongoose from 'mongoose';
import Wishlist from '@/db/models/wishlistModel';

export const wishlistRepo = {
  findByUser: (userId: string) => Wishlist.findOne({ userId }),

  findByUserPopulated: (userId: string) =>
    Wishlist.findOne({ userId }).populate('items.productId'),

  createForUser: (userId: string, productId: string) =>
    Wishlist.create({ userId, items: [{ productId }] }),

  hasProduct: (userId: string, productId: string) =>
    Wishlist.findOne({
      userId,
      items: { $elemMatch: { productId } },
    }),

  addProduct: (userId: string, productId: string) =>
    Wishlist.updateOne(
      { userId },
      { $addToSet: { items: { productId } } }
    ),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
