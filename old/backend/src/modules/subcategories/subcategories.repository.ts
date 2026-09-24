import { FilterQuery, UpdateQuery } from 'mongoose';
import SubCategory from '@/db/models/subCategoryModel';

export const subcategoriesRepo = {
  /* ─── Admin list (paginated + search + parent populated) ─── */
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ categories: unknown[]; total: number }> => {
    const query: FilterQuery<unknown> = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};
    const skip = (page - 1) * limit;
    const [categories, total] = await Promise.all([
      SubCategory.find(query)
        .populate('parentCategory', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SubCategory.countDocuments(query),
    ]);
    return { categories, total };
  },

  findById: (id: string) => SubCategory.findById(id),
  findBySlug: (slug: string) => SubCategory.findOne({ slug }),

  findByParent: (parentId: string) =>
    SubCategory.find({ parentCategory: parentId }).select('_id name').exec(),

  create: (data: Record<string, unknown>) => SubCategory.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    SubCategory.findByIdAndUpdate(id, patch, { new: true }),
  deleteById: (id: string) => SubCategory.findByIdAndDelete(id),
};
