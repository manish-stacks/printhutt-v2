import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import Offer from '@/db/models/offerModel';

export const offersRepo = {
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ offers: unknown[]; total: number }> => {
    const query: FilterQuery<unknown> = search
      ? { offerTitle: { $regex: search, $options: 'i' } }
      : {};
    const skip = (page - 1) * limit;
    const [offers, total] = await Promise.all([
      Offer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Offer.countDocuments(query),
    ]);
    return { offers, total };
  },

  findById: (id: string) => Offer.findById(id),
  fetchOptions: () => Offer.find().select('_id offerTitle'),
  create: (data: Record<string, unknown>) => Offer.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    Offer.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
  deleteById: (id: string) => Offer.findByIdAndDelete(id),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
