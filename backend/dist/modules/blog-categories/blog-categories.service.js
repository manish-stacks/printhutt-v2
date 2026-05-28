"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.createBlogCategory = createBlogCategory;
exports.updateBlogCategory = updateBlogCategory;
exports.deleteBlogCategory = deleteBlogCategory;
/**
 * BlogCategories service. Ports src/app/api/blog/category/route.ts (GET+POST)
 * and src/app/api/blog/category/[id]/route.ts (PUT+DELETE).
 */
const errors_1 = require("@/utils/errors");
const blog_categories_repository_1 = require("./blog-categories.repository");
async function adminList(q) {
    const { blogCategories, total } = await blog_categories_repository_1.blogCategoriesRepo.adminList(q.page, q.limit, q.search);
    return {
        blogCategories,
        pagination: { total, pages: Math.ceil(total / q.limit), page: q.page, limit: q.limit },
    };
}
async function createBlogCategory(name, isActive) {
    return blog_categories_repository_1.blogCategoriesRepo.create({ name, isActive });
}
async function updateBlogCategory(id, name, isActive) {
    const cat = await blog_categories_repository_1.blogCategoriesRepo.findById(id);
    if (!cat)
        throw new errors_1.NotFoundError('Blog category not found');
    cat.name = name || cat.name;
    if (isActive !== undefined)
        cat.isActive = isActive === 'true' ? true : cat.isActive;
    await cat.save();
}
async function deleteBlogCategory(id) {
    if (!blog_categories_repository_1.blogCategoriesRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Blog Category ID');
    const cat = await blog_categories_repository_1.blogCategoriesRepo.findById(id);
    if (!cat)
        throw new errors_1.NotFoundError('Blog category not found');
    await cat.deleteOne();
}
//# sourceMappingURL=blog-categories.service.js.map