import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import Blog from '@/db/models/blogModel';
import BlogCategory from '@/db/models/blogCategoryModel';

export const blogsRepo = {
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ blogs: unknown[]; total: number }> => {
    const query: FilterQuery<unknown> = search
      ? { title: { $regex: search, $options: 'i' } }
      : {};
    const skip = (page - 1) * limit;
    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate({ path: 'category', model: BlogCategory })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(query),
    ]);
    return { blogs, total };
  },

  storefrontList: () =>
    Blog.find({ status: 'active' })
      .populate({ path: 'category', model: BlogCategory })
      .sort({ createdAt: -1 })
      .lean(),

  findBySlug: (slug: string) =>
    Blog.findOne({ slug })
      .populate({ path: 'category', model: BlogCategory })
      .lean(),

  findById: (id: string) => Blog.findById(id),
  create: (data: Record<string, unknown>) => Blog.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    Blog.findByIdAndUpdate(id, patch, { new: true }),
  deleteById: (id: string) => Blog.findByIdAndDelete(id),
  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
