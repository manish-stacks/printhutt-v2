"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriesRepo = void 0;
const categoryModel_1 = __importDefault(require("@/db/models/categoryModel"));
const subCategoryModel_1 = __importDefault(require("@/db/models/subCategoryModel"));
const productModel_1 = __importDefault(require("@/db/models/productModel"));
exports.categoriesRepo = {
    /* ─── Admin list (paginated + search by name) ─── */
    adminList: async (page, limit, search) => {
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};
        const skip = (page - 1) * limit;
        const [categories, total] = await Promise.all([
            categoryModel_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            categoryModel_1.default.countDocuments(query),
        ]);
        return { categories, total };
    },
    /* ─── Lookup helpers ─── */
    findById: (id) => categoryModel_1.default.findById(id),
    findBySlug: (slug) => categoryModel_1.default.findOne({ slug }),
    /* ─── Lightweight options list (id + name) for dropdowns ─── */
    fetchOptions: () => categoryModel_1.default.find().select('_id name'),
    /* ─── Create / update / delete ─── */
    create: (data) => categoryModel_1.default.create(data),
    updateById: (id, patch) => categoryModel_1.default.findByIdAndUpdate(id, patch, { new: true }),
    deleteById: (id) => categoryModel_1.default.findByIdAndDelete(id),
    /* ─── Featured (storefront) ─── */
    findFeatured: () => categoryModel_1.default.find({ featured: true }, { name: 1, _id: 1 })
        .sort({ level: 1 })
        .lean(),
    /* ─── Storefront with subcategory + product counts ─── */
    findAllWithSubAndCounts: async (limit) => {
        let q = categoryModel_1.default.find().sort({ createdAt: -1 }).lean();
        if (limit)
            q = q.limit(limit);
        const categories = await q;
        return Promise.all(categories.map(async (category) => {
            const subcategories = await subCategoryModel_1.default.find({
                parentCategory: category._id,
            }).lean();
            const totalCategoryProducts = await productModel_1.default.countDocuments({
                category: category._id,
            });
            const subcategoriesWithProductCount = await Promise.all(subcategories.map(async (subcategory) => {
                const totalSubcategoryProducts = await productModel_1.default.countDocuments({
                    subcategory: subcategory._id,
                });
                return { ...subcategory, totalProducts: totalSubcategoryProducts };
            }));
            return {
                ...category,
                subcategories: subcategoriesWithProductCount,
                totalProducts: totalCategoryProducts,
            };
        }));
    },
    /* ─── Subcategories of a category-slug + product counts ─── */
    findSubsByCategorySlug: async (categorySlug, limit) => {
        const category = await categoryModel_1.default.findOne({ slug: categorySlug })
            .sort({ createdAt: -1 })
            .lean();
        if (!category)
            return null;
        let q = subCategoryModel_1.default.find({ parentCategory: category._id }).lean();
        if (limit)
            q = q.limit(limit);
        const subcategories = await q;
        return Promise.all(subcategories.map(async (sub) => {
            const productCount = await productModel_1.default.countDocuments({
                subcategory: sub._id,
            });
            return { ...sub, productCount };
        }));
    },
};
//# sourceMappingURL=categories.repository.js.map