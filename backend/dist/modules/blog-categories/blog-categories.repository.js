"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogCategoriesRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const blogCategoryModel_1 = __importDefault(require("@/db/models/blogCategoryModel"));
exports.blogCategoriesRepo = {
    adminList: async (page, limit, search) => {
        const query = search ? { name: { $regex: search, $options: 'i' } } : {};
        const skip = (page - 1) * limit;
        const [blogCategories, total] = await Promise.all([
            blogCategoryModel_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            blogCategoryModel_1.default.countDocuments(query),
        ]);
        return { blogCategories, total };
    },
    findById: (id) => blogCategoryModel_1.default.findById(id),
    create: (data) => blogCategoryModel_1.default.create(data),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=blog-categories.repository.js.map