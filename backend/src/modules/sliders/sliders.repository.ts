import mongoose, { FilterQuery } from 'mongoose';
import Slider from '@/db/models/sliderModel';

export const slidersRepo = {
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ sliders: unknown[]; total: number }> => {
    const query: FilterQuery<unknown> = search
      ? { title: { $regex: search, $options: 'i' } }
      : {};
    const skip = (page - 1) * limit;
    const [sliders, total] = await Promise.all([
      Slider.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Slider.countDocuments(query),
    ]);
    return { sliders, total };
  },

  storefrontActive: () =>
    Slider.find({ isActive: true }).sort({ level: 1 }).limit(4).lean(),

  findById: (id: string) => Slider.findById(id),
  create: (data: Record<string, unknown>) => Slider.create(data),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
