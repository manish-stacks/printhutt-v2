"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.byId = byId;
exports.createSubcategory = createSubcategory;
exports.updateSubcategory = updateSubcategory;
exports.deleteSubcategory = deleteSubcategory;
exports.patchSubcategory = patchSubcategory;
exports.fetchByParent = fetchByParent;
exports.bySlug = bySlug;
const storage_1 = require("@/utils/storage");
const errors_1 = require("@/utils/errors");
const client_1 = require("@/redis/client");
const subcategories_repository_1 = require("./subcategories.repository");
const CACHE_PREFIX = 'subcategories:';
/* ──────────────── Admin: paginated list ──────────────── */
async function adminList(q) {
    const { categories, total } = await subcategories_repository_1.subcategoriesRepo.adminList(q.page, q.limit, q.search);
    return {
        success: true,
        message: 'Categories fetched successfully',
        categories,
        pagination: {
            total,
            pages: Math.ceil(total / q.limit),
            page: q.page,
            limit: q.limit,
        },
    };
}
/* ──────────────── Admin: single read ──────────────── */
async function byId(id) {
    const item = await subcategories_repository_1.subcategoriesRepo.findById(id);
    if (!item)
        throw new errors_1.NotFoundError('Post not found');
    return item;
}
async function createSubcategory(body, imageFile) {
    if (!imageFile)
        throw new errors_1.BadRequestError('No valid file uploaded');
    const uploaded = await (0, storage_1.uploadImage)(imageFile, 'categories', 60, 60);
    const created = await subcategories_repository_1.subcategoriesRepo.create({
        name: body.name,
        slug: body.slug,
        description: body.description,
        metaKeywords: body.metaKeywords,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        parentCategory: body.parentCategory ?? null,
        level: body.level,
        status: body.status === true,
        image: uploaded,
    });
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    await (0, client_1.cacheDelPattern)('categories:*'); // invalidate parent listings too
    return { success: true, message: 'Category created successfully', data: created };
}
/* ──────────────── Admin: update (PUT, multipart) ──────────────── */
async function updateSubcategory(id, body, imageFile) {
    const existing = await subcategories_repository_1.subcategoriesRepo.findById(id);
    if (!existing)
        throw new errors_1.NotFoundError('Category not found');
    let imageUrl = existing.image;
    if (imageFile) {
        const uploaded = await (0, storage_1.uploadImage)(imageFile, 'categories', 800, 800);
        if (existing.image?.public_id) {
            try {
                await (0, storage_1.deleteImage)(existing.image.public_id);
            }
            catch {
                /* swallow */
            }
        }
        imageUrl = uploaded;
    }
    existing.name = body.name ?? existing.name;
    existing.slug = body.slug ?? existing.slug;
    existing.description = body.description ?? existing.description;
    existing.metaKeywords = body.metaKeywords ?? existing.metaKeywords;
    existing.metaTitle = body.metaTitle ?? existing.metaTitle;
    existing.metaDescription = body.metaDescription ?? existing.metaDescription;
    if (body.parentCategory !== undefined) {
        existing.parentCategory = body.parentCategory;
    }
    if (body.level !== undefined) {
        existing.level = body.level;
    }
    existing.status = body.status ?? existing.status;
    existing.image = imageUrl;
    await existing.save();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    await (0, client_1.cacheDelPattern)('categories:*');
    return { success: true, message: 'Category updated successfully', data: existing };
}
/* ──────────────── Admin: delete ──────────────── */
async function deleteSubcategory(id) {
    const existing = await subcategories_repository_1.subcategoriesRepo.findById(id);
    if (!existing)
        throw new errors_1.NotFoundError('Category not found');
    if (existing.image?.public_id) {
        try {
            await (0, storage_1.deleteImage)(existing.image.public_id);
        }
        catch {
            /* swallow */
        }
    }
    await subcategories_repository_1.subcategoriesRepo.deleteById(id);
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    await (0, client_1.cacheDelPattern)('categories:*');
    return { success: true, message: 'Category deleted successfully!' };
}
/* ──────────────── Admin: PATCH status ──────────────── */
async function patchSubcategory(id, body) {
    const updated = await subcategories_repository_1.subcategoriesRepo.updateById(id, { status: body.status });
    if (!updated)
        throw new errors_1.NotFoundError('Category not found');
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return { success: true, message: 'Successfully updated category' };
}
/* ──────────────── Public: fetch subs by parent id ──────────────── */
async function fetchByParent(parentId) {
    const categories = await subcategories_repository_1.subcategoriesRepo.findByParent(parentId);
    if (!categories || categories.length === 0) {
        throw new errors_1.NotFoundError('No categories found for the given parent ID');
    }
    return { message: 'Data fetched successfully', category: categories };
}
/* ──────────────── Storefront: GET /api/subcategories/slug/:slug ──── */
async function bySlug(slug) {
    const sub = await subcategories_repository_1.subcategoriesRepo.findBySlug(slug);
    if (!sub)
        throw new errors_1.NotFoundError('Subcategory not found');
    return sub;
}
//# sourceMappingURL=subcategories.service.js.map