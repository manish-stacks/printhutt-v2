"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subcategoriesRepo = void 0;
const subCategoryModel_1 = __importDefault(require("@/db/models/subCategoryModel"));
exports.subcategoriesRepo = {
    /* ─── Admin list (paginated + search + parent populated) ─── */
    adminList: async (page, limit, search) => {
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};
        const skip = (page - 1) * limit;
        const [categories, total] = await Promise.all([
            subCategoryModel_1.default.find(query)
                .populate('parentCategory', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            subCategoryModel_1.default.countDocuments(query),
        ]);
        return { categories, total };
    },
    findById: (id) => subCategoryModel_1.default.findById(id),
    findBySlug: (slug) => subCategoryModel_1.default.findOne({ slug }),
    findByParent: (parentId) => subCategoryModel_1.default.find({ parentCategory: parentId }).select('_id name').exec(),
    create: (data) => subCategoryModel_1.default.create(data),
    updateById: (id, patch) => subCategoryModel_1.default.findByIdAndUpdate(id, patch, { new: true }),
    deleteById: (id) => subCategoryModel_1.default.findByIdAndDelete(id),
};
//# sourceMappingURL=subcategories.repository.js.map