"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const productModel_1 = __importDefault(require("@/db/models/productModel"));
const categoryModel_1 = __importDefault(require("@/db/models/categoryModel"));
const subCategoryModel_1 = __importDefault(require("@/db/models/subCategoryModel"));
const offerModel_1 = __importDefault(require("@/db/models/offerModel"));
/**
 * Product repository — data-access layer.
 * All queries from the original Next.js product routes live here.
 */
exports.productRepo = {
    /* ─── Admin list (paginated + search) ─── */
    adminList: async (page, limit, search) => {
        const query = search
            ? { title: { $regex: search, $options: 'i' } }
            : {};
        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            productModel_1.default.find(query)
                .populate({ path: 'category', model: categoryModel_1.default })
                .populate({ path: 'subcategory', model: subCategoryModel_1.default })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            productModel_1.default.countDocuments(query),
        ]);
        return { products, total };
    },
    /* ─── Storefront base list (populated, status:true, newest first) ─── */
    storefrontBase: () => productModel_1.default.find({ status: true })
        .populate({ path: 'category', model: categoryModel_1.default })
        .populate({ path: 'subcategory', model: subCategoryModel_1.default })
        .sort({ createdAt: -1 }),
    /* ─── Lookups ─── */
    findById: (id) => productModel_1.default.findById(id),
    findByIdRaw: (id) => productModel_1.default.findById(id).lean(),
    findByIdFull: (id) => productModel_1.default.findById(id)
        .populate({ path: 'category', model: categoryModel_1.default })
        .populate({ path: 'subcategory', model: subCategoryModel_1.default }),
    findBySlug: (slug) => productModel_1.default.findOne({ slug }).populate({ path: 'category', model: categoryModel_1.default }).populate({ path: 'subcategory', model: subCategoryModel_1.default }),
    findByCategoryId: (categoryId, limit) => {
        const q = productModel_1.default.find({ category: categoryId })
            .sort({ createdAt: -1 })
            .populate({ path: 'category', model: categoryModel_1.default })
            .populate({ path: 'subcategory', model: subCategoryModel_1.default });
        return limit !== null ? q.limit(limit) : q;
    },
    findByCategorySlug: async (categorySlug, limit) => {
        const category = await categoryModel_1.default.findOne({ slug: categorySlug })
            .select('_id')
            .lean();
        if (!category)
            return null;
        const products = await productModel_1.default.find({ category: category._id, status: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        return { category, products };
    },
    findBySubCategorySlug: async (subCategorySlug, page, limit) => {
        const sub = await subCategoryModel_1.default.findOne({ slug: subCategorySlug }).lean();
        if (!sub)
            return null;
        const [products, total] = await Promise.all([
            productModel_1.default.find({ subcategory: sub._id, status: true })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            productModel_1.default.countDocuments({ subcategory: sub._id, status: true }),
        ]);
        return { products, total };
    },
    /* ─── New arrivals — random sample with aggregation ─── */
    randomSampleWithCategoryAndSub: async (matchQuery, size) => productModel_1.default.aggregate([
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
    withOffers: (limit) => productModel_1.default.find({ offers: { $exists: true, $not: { $size: 0 } } })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate({ path: 'category', model: categoryModel_1.default, select: 'name slug' })
        .populate({ path: 'offers', model: offerModel_1.default, select: 'title discount' })
        .lean(),
    /* ─── Search suggestions ─── */
    suggest: (q, limit) => {
        const filter = q
            ? {
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { tags: { $regex: q, $options: 'i' } },
                ],
            }
            : {};
        return productModel_1.default.find(filter).select('title slug _id tags').limit(limit).lean();
    },
    /* ─── Top related ─── */
    topRelated: (categoryId, limit) => {
        let q;
        if (categoryId === 'all') {
            q = productModel_1.default.find({ status: true });
        }
        else if (categoryId === 'new-arrival') {
            q = productModel_1.default.find({ new: true, status: true });
        }
        else {
            // Only treat as ObjectId here — validate first
            if (!mongoose_1.default.Types.ObjectId.isValid(categoryId)) {
                q = productModel_1.default.find({ status: true }); // fallback
            }
            else {
                q = productModel_1.default.find({ category: categoryId, status: true });
            }
        }
        q = q.populate({ path: 'category', model: categoryModel_1.default }).sort({ createdAt: -1 });
        if (limit !== null)
            q = q.limit(limit);
        return q.lean();
    },
    /* ─── Mutations ─── */
    create: (data) => productModel_1.default.create(data),
    updateById: (id, patch) => productModel_1.default.findByIdAndUpdate(id, patch, { new: true }),
    patchStatus: (id, status) => productModel_1.default.findByIdAndUpdate(id, { status }, { new: true }),
    deleteById: (id) => productModel_1.default.findByIdAndDelete(id),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=products.repository.js.map