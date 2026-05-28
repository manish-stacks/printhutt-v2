"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogsRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const blogModel_1 = __importDefault(require("@/db/models/blogModel"));
const blogCategoryModel_1 = __importDefault(require("@/db/models/blogCategoryModel"));
exports.blogsRepo = {
    adminList: async (page, limit, search) => {
        const query = search
            ? { title: { $regex: search, $options: 'i' } }
            : {};
        const skip = (page - 1) * limit;
        const [blogs, total] = await Promise.all([
            blogModel_1.default.find(query)
                .populate({ path: 'category', model: blogCategoryModel_1.default })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            blogModel_1.default.countDocuments(query),
        ]);
        return { blogs, total };
    },
    storefrontList: () => blogModel_1.default.find({ status: 'active' })
        .populate({ path: 'category', model: blogCategoryModel_1.default })
        .sort({ createdAt: -1 })
        .lean(),
    findBySlug: (slug) => blogModel_1.default.findOne({ slug })
        .populate({ path: 'category', model: blogCategoryModel_1.default })
        .lean(),
    findById: (id) => blogModel_1.default.findById(id),
    create: (data) => blogModel_1.default.create(data),
    updateById: (id, patch) => blogModel_1.default.findByIdAndUpdate(id, patch, { new: true }),
    deleteById: (id) => blogModel_1.default.findByIdAndDelete(id),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=blogs.repository.js.map