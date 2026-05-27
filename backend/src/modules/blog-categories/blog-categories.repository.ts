import mongoose, { FilterQuery } from 'mongoose';
import BlogCategory from '@/db/models/blogCategoryModel';

export const blogCategoriesRepo = {
  adminList: async (page: number, limit: number, search: string) => {
    const query: FilterQuery<unknown> = search ? { name: { $regex: search, $options: 'i' } } : {};
    const skip = (page - 1) * limit;
    const [blogCategories, total] = await Promise.all([
      BlogCategory.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BlogCategory.countDocuments(query),
    ]);
    return { blogCategories, total };
  },
  findById: (id: string) => BlogCategory.findById(id),
  create: (data: Record<string, unknown>) => BlogCategory.create(data),
  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
