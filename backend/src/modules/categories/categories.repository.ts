import { FilterQuery, UpdateQuery } from 'mongoose';
import Category from '@/db/models/categoryModel';
import SubCategory from '@/db/models/subCategoryModel';
import Product from '@/db/models/productModel';

export const categoriesRepo = {
  /* ─── Admin list (paginated + search by name) ─── */
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
      Category.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Category.countDocuments(query),
    ]);
    return { categories, total };
  },

  /* ─── Lookup helpers ─── */
  findById: (id: string) => Category.findById(id),
  findBySlug: (slug: string) => Category.findOne({ slug }),

  /* ─── Lightweight options list (id + name) for dropdowns ─── */
  fetchOptions: () => Category.find().select('_id name'),

  /* ─── Create / update / delete ─── */
  create: (data: Record<string, unknown>) => Category.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    Category.findByIdAndUpdate(id, patch, { new: true }),
  deleteById: (id: string) => Category.findByIdAndDelete(id),

  /* ─── Featured (storefront) ─── */
  findFeatured: () =>
    Category.find({ featured: true }, { name: 1, _id: 1 })
      .sort({ level: 1 })
      .lean(),

  /* ─── Storefront with subcategory + product counts ─── */
  findAllWithSubAndCounts: async (limit: number | null): Promise<unknown[]> => {
    let q = Category.find().sort({ createdAt: -1 }).lean<Array<{ _id: unknown; [k: string]: unknown }>>();
    if (limit) q = q.limit(limit);
    const categories = await q;

    return Promise.all(
      categories.map(async (category) => {
        const subcategories = await SubCategory.find({
          parentCategory: category._id,
        }).lean();

        const totalCategoryProducts = await Product.countDocuments({
          category: category._id,
        });

        const subcategoriesWithProductCount = await Promise.all(
          subcategories.map(async (subcategory) => {
            const totalSubcategoryProducts = await Product.countDocuments({
              subcategory: subcategory._id,
            });
            return { ...subcategory, totalProducts: totalSubcategoryProducts };
          })
        );

        return {
          ...category,
          subcategories: subcategoriesWithProductCount,
          totalProducts: totalCategoryProducts,
        };
      })
    );
  },

  /* ─── Subcategories of a category-slug + product counts ─── */
  findSubsByCategorySlug: async (
    categorySlug: string,
    limit: number | null
  ): Promise<unknown[] | null> => {
    const category = await Category.findOne({ slug: categorySlug })
      .sort({ createdAt: -1 })
      .lean<{ _id: unknown } | null>();
    if (!category) return null;

    let q = SubCategory.find({ parentCategory: category._id }).lean<
      Array<{ _id: unknown; [k: string]: unknown }>
    >();
    if (limit) q = q.limit(limit);
    const subcategories = await q;

    return Promise.all(
      subcategories.map(async (sub) => {
        const productCount = await Product.countDocuments({
          subcategory: sub._id,
        });
        return { ...sub, productCount };
      })
    );
  },
};
