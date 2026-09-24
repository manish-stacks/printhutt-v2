import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import Product from '@/db/models/productModel';
import Category from '@/db/models/categoryModel';
import SubCategory from '@/db/models/subCategoryModel';
import Offer from '@/db/models/offerModel';
import WarrantyInformation from '@/db/models/warrantyInformationModel';
import ShippingInformation from '@/db/models/shippingInformationModel';
import ReturnPolicy from '@/db/models/returnPolicyModule';
import Review from '@/db/models/reviewModel';
import User from '@/db/models/userModel';

/**
 * Product repository — data-access layer.
 * All queries from the original Next.js product routes live here.
 */

/* ─── Seeded shuffle (same seed → same order → pagination stable) ─── */
const seededShuffle = <T,>(arr: T[], seed: number): T[] => {
  const a = [...arr];
  let t = (seed || 1) >>> 0;
  const rnd = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pageBySeed = async (filter: FilterQuery<unknown>, page: number, limit: number, seed?: number) => {
  if (seed === undefined) {
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate({ path: 'category', model: Category, select: 'name slug' }).lean(),
      Product.countDocuments(filter),
    ]);
    return { products: products as unknown[], total };
  }
  const ids = (await Product.find(filter).select('_id').lean<{ _id: unknown }[]>()).map((d) => String(d._id));
  const pageIds = seededShuffle(ids, seed).slice((page - 1) * limit, page * limit);
  const docs = await Product.find({ _id: { $in: pageIds } })
    .populate({ path: 'category', model: Category, select: 'name slug' }).lean();
  const map = new Map((docs as any[]).map((d) => [String(d._id), d]));
  return { products: pageIds.map((id) => map.get(id)).filter(Boolean) as unknown[], total: ids.length };
};

export const productRepo = {
  /* ─── Admin list (paginated + search) ─── */
  adminList: async (
    page: number,
    limit: number,
    search: string,
    f: Record<string, any> = {}
  ): Promise<{ products: unknown[]; total: number }> => {
    const query: FilterQuery<any> = {};
    if (search) {
      const rx = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      query.$or = [{ title: rx }, { sku: rx }, { slug: rx }];
    }
    if (f.category && mongoose.isValidObjectId(f.category)) query.category = f.category;
    if (f.status === 'active') query.status = true;
    if (f.status === 'inactive') query.status = false;
    if (f.stock === 'out') query.stock = { $lte: 0 };
    if (f.stock === 'low') query.stock = { $gt: 0, $lte: 10 };
    if (f.stock === 'in') query.stock = { $gt: 0 };
    if (f.discount === 'yes') query.discountPrice = { $gt: 0 };
    if (f.discount === 'no') query.$and = [{ $or: [{ discountPrice: { $lte: 0 } }, { discountPrice: null }] }];
    if (f.type === 'customize') query.isCustomize = true;
    if (f.type === 'variant') query.isVarientStatus = true;
    if (f.type === 'simple') { query.isCustomize = { $ne: true }; query.isVarientStatus = { $ne: true }; }
    if (f.minPrice != null || f.maxPrice != null) {
      query.price = {};
      if (f.minPrice != null) query.price.$gte = f.minPrice;
      if (f.maxPrice != null) query.price.$lte = f.maxPrice;
    }
    const sortMap: Record<string, any> = {
      newest: { createdAt: -1 }, oldest: { createdAt: 1 }, price_asc: { price: 1 },
      price_desc: { price: -1 }, stock_asc: { stock: 1 }, title: { title: 1 },
    };
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({ path: 'category', model: Category })
        .populate({ path: 'subcategory', model: SubCategory })
        .sort(sortMap[f.sort] || sortMap.newest)
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
  findByIdFull: (id: string) => {
    const q = Product.findById(id)
      .populate({ path: 'category', model: Category })
      .populate({ path: 'subcategory', model: SubCategory })
      .populate({ path: 'warrantyInformation', model: WarrantyInformation })
      .populate({ path: 'shippingInformation', model: ShippingInformation })
      .populate({ path: 'returnPolicy', model: ReturnPolicy })
      .populate({
        path: 'reviews',
        model: Review,
        populate: {
          path: 'userId',
          model: User
        }
      })
      .populate({ path: 'offers', model: Offer });
    return q;
  },

  findBySlug: (slug: string) => {
    const q = Product.findOne({ slug })
      .populate({ path: 'category', model: Category })
      .populate({ path: 'subcategory', model: SubCategory })
      .populate({ path: 'warrantyInformation', model: WarrantyInformation })
      .populate({ path: 'shippingInformation', model: ShippingInformation })
      .populate({ path: 'returnPolicy', model: ReturnPolicy })
      .populate({
        path: 'reviews',
        model: Review,
        populate: {
          path: 'userId',
          model: User
        }
      })
      .populate({ path: 'offers', model: Offer });

    return q;
  },

  findByCategoryId: (categoryId: string, limit: number | null) => {
    const q = Product.find({ category: categoryId })
      .sort({ createdAt: -1 })
      .populate({ path: 'category', model: Category })
      .populate({ path: 'subcategory', model: SubCategory })
      .populate({ path: 'warrantyInformation', model: WarrantyInformation })
      .populate({ path: 'shippingInformation', model: ShippingInformation })
      .populate({ path: 'returnPolicy', model: ReturnPolicy })
      .populate({
        path: 'reviews',
        model: Review,
        populate: {
          path: 'userId',
          model: User
        }
      })
      .populate({ path: 'offers', model: Offer });
    return limit !== null ? q.limit(limit) : q;
  },

  findByCategorySlug: async (
    categorySlug: string,
    page: number,
    limit: number,
    seed?: number
  ): Promise<{ category: unknown; products: unknown[]; total: number } | null> => {
    const category = await Category.findOne({ slug: categorySlug })
      .select('_id')
      .lean<{ _id: unknown } | null>();
    if (!category) return null;

    const { products, total } = await pageBySeed({ category: category._id, status: true }, page, limit, seed);
    return { category, products, total };
  },

  findBySubCategorySlug: async (
    subCategorySlug: string,
    page: number,
    limit: number,
    seed?: number
  ): Promise<{ products: unknown[]; total: number, categories: unknown[] } | null> => {
    const sub = await SubCategory.findOne({ slug: subCategorySlug }).lean<{
      _id: unknown;
      parentCategory: unknown;
    } | null>();
    if (!sub) return null;
    const [{ products, total }, categories] = await Promise.all([
      pageBySeed({ subcategory: sub._id, status: true }, page, limit, seed),
      SubCategory.find({ status: true, parentCategory: sub.parentCategory }).lean(),
    ]);
    return { products, total, categories };
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
    Product.find({ status: true, offers: { $exists: true, $not: { $size: 0 } } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({ path: 'category', model: Category, select: 'name slug' })
      .populate({ path: 'offers', model: Offer, select: 'title discount' })
      .lean(),

  /* ─── Search suggestions ─── */
  suggest: (q: string, limit: number) => {
    const filter: FilterQuery<unknown> = q
      ? {
        status: true,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
        ],
      }
      : { status: true };
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

  /* ─── Storefront filtered query (replaces in-memory filtering) ─── */
  storefrontFiltered: (
    filter: FilterQuery<unknown>,
    sort: Record<string, 1 | -1>,
    skip: number,
    limit: number
  ) =>
    Product.find(filter)
      .populate({ path: 'category', model: Category, select: 'name slug' })
      .populate({ path: 'subcategory', model: SubCategory, select: 'name slug' })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),

  countFiltered: (filter: FilterQuery<unknown>) =>
    Product.countDocuments(filter),
  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    Product.findByIdAndUpdate(id, patch, { new: true }),
  patchStatus: (id: string, status: boolean) =>
    Product.findByIdAndUpdate(id, { status }, { new: true }),
  deleteById: (id: string) => Product.findByIdAndDelete(id),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
