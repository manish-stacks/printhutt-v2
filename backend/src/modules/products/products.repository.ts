import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import Product from '@/db/models/productModel';
import Category from '@/db/models/categoryModel';
import SubCategory from '@/db/models/subCategoryModel';
import Offer from '@/db/models/offerModel';

/**
 * Product repository — data-access layer.
 * All queries from the original Next.js product routes live here.
 */
export const productRepo = {
  /* ─── Admin list (paginated + search) ─── */
  adminList: async (
    page: number,
    limit: number,
    search: string
  ): Promise<{ products: unknown[]; total: number }> => {
    const query: FilterQuery<unknown> = search
      ? { title: { $regex: search, $options: 'i' } }
      : {};
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({ path: 'category', model: Category })
        .populate({ path: 'subcategory', model: SubCategory })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);
    return { products, total };
  },

  /* ─── Storefront base list (populated, status:true, newest first) ─── */
  storefrontBase: () =>
    Product.find({ status: true })
      .populate({ path: 'category', model: Category })
      .populate({ path: 'subcategory', model: SubCategory })
      .sort({ createdAt: -1 }),

  /* ─── Lookups ─── */
  findById: (id: string) => Product.findById(id),
  findByIdRaw: (id: string) => Product.findById(id).lean(),
  findByIdFull: (id: string) =>
    Product.findById(id)
      .populate({ path: 'category', model: Category })
      .populate({ path: 'subcategory', model: SubCategory }),
  findBySlug: (slug: string) => Product.findOne({ slug }).populate({ path: 'category', model: Category }).populate({ path: 'subcategory', model: SubCategory }),
  findByCategoryId: (categoryId: string, limit: number | null) => {
    const q = Product.find({ category: categoryId })
      .sort({ createdAt: -1 })
      .populate({ path: 'category', model: Category })
      .populate({ path: 'subcategory', model: SubCategory });
    return limit !== null ? q.limit(limit) : q;
  },

  findByCategorySlug: async (
    categorySlug: string,
    limit: number
  ): Promise<{ category: unknown; products: unknown[] } | null> => {
    const category = await Category.findOne({ slug: categorySlug })
      .select('_id')
      .lean<{ _id: unknown } | null>();
    if (!category) return null;
    const products = await Product.find({ category: category._id, status: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return { category, products };
  },

  findBySubCategorySlug: async (
    subCategorySlug: string,
    page: number,
    limit: number
  ): Promise<{ products: unknown[]; total: number } | null> => {
    const sub = await SubCategory.findOne({ slug: subCategorySlug }).lean<{
      _id: unknown;
    } | null>();
    if (!sub) return null;
    const [products, total] = await Promise.all([
      Product.find({ subcategory: sub._id, status: true })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments({ subcategory: sub._id, status: true }),
    ]);
    return { products, total };
  },

  /* ─── New arrivals — random sample with aggregation ─── */
  randomSampleWithCategoryAndSub: async (
    matchQuery: FilterQuery<unknown>,
    size: number
  ): Promise<unknown[]> =>
    Product.aggregate([
      { $match: matchQuery },
      { $sample: { size } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category',
        },
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: 'subcategory',
          foreignField: '_id',
          as: 'subcategory',
        },
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$category', 0] },
          subcategory: { $arrayElemAt: ['$subcategory', 0] },
        },
      },
    ]),

  /* ─── Products with at least one offer (newest first) ─── */
  withOffers: (limit: number) =>
    Product.find({ offers: { $exists: true, $not: { $size: 0 } } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'category', model: Category, select: 'name slug' })
      .populate({ path: 'offers', model: Offer, select: 'title discount' })
      .lean(),

  /* ─── Search suggestions ─── */
  suggest: (q: string, limit: number) => {
    const filter: FilterQuery<unknown> = q
      ? {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
        ],
      }
      : {};
    return Product.find(filter).select('title slug _id tags').limit(limit).lean();
  },

  /* ─── Top related ─── */
  topRelated: (categoryId: string, limit: number | null) => {
    let q;
    if (categoryId === 'all') {
      q = Product.find({ status: true });
    } else if (categoryId === 'new-arrival') {
      q = Product.find({ new: true, status: true });
    } else {
      // Only treat as ObjectId here — validate first
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        q = Product.find({ status: true }); // fallback
      } else {
        q = Product.find({ category: categoryId, status: true });
      }
    }
    q = q.populate({ path: 'category', model: Category }).sort({ createdAt: -1 });
    if (limit !== null) q = q.limit(limit);
    return q.lean();
  },

  /* ─── Mutations ─── */
  create: (data: Record<string, unknown>) => Product.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    Product.findByIdAndUpdate(id, patch, { new: true }),
  patchStatus: (id: string, status: boolean) =>
    Product.findByIdAndUpdate(id, { status }, { new: true }),
  deleteById: (id: string) => Product.findByIdAndDelete(id),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
