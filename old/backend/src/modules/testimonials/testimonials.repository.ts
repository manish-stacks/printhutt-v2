import mongoose, { FilterQuery } from 'mongoose';
import Testimonials from '@/db/models/testimonialsModel';

export const testimonialsRepo = {
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ testimonials: unknown[]; total: number }> => {
    const query: FilterQuery<unknown> = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};
    const skip = (page - 1) * limit;
    const [testimonials, total] = await Promise.all([
      Testimonials.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Testimonials.countDocuments(query),
    ]);
    return { testimonials, total };
  },

  storefrontRecent: () =>
    Testimonials.find().sort({ createdAt: -1 }).limit(4).lean(),

  findById: (id: string) => Testimonials.findById(id),
  create: (data: Record<string, unknown>) => Testimonials.create(data),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
