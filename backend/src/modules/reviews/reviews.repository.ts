import mongoose, { FilterQuery } from 'mongoose';
import Review from '@/db/models/reviewModel';
import Product from '@/db/models/productModel';

export const reviewsRepo = {
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ reviews: unknown[]; total: number }> => {
    const query: FilterQuery<unknown> = search
      ? { review: { $regex: search, $options: 'i' } }
      : {};
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('userId', 'name email')
        .populate('productId', 'title slug thumbnail')
        .populate('orderId', 'orderId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query),
    ]);
    return { reviews, total };
  },

  findById: (id: string) => Review.findById(id),

  create: (data: Record<string, unknown>) => Review.create(data),

  pushReviewIdToProduct: (productId: string, reviewId: unknown) =>
    Product.updateOne({ _id: productId }, { $push: { reviews: reviewId } }).exec(),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
