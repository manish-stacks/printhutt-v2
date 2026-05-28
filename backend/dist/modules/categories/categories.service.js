"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.byId = byId;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.patchCategory = patchCategory;
exports.fetchOptions = fetchOptions;
exports.storefrontList = storefrontList;
exports.featured = featured;
exports.withSub = withSub;
exports.bySlug = bySlug;
const storage_1 = require("@/utils/storage");
const errors_1 = require("@/utils/errors");
const client_1 = require("@/redis/client");
const categories_repository_1 = require("./categories.repository");
const CACHE_PREFIX = 'categories:';
const TTL_SECS = 300;
/* ──────────────── Admin: paginated list ──────────────── */
async function adminList(q) {
    const { categories, total } = await categories_repository_1.categoriesRepo.adminList(q.page, q.limit, q.search);
    return {
        success: true,
        message: 'Categories fetched successfully',
        data: categories,
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
    const category = await categories_repository_1.categoriesRepo.findById(id);
    if (!category)
        throw new errors_1.NotFoundError('Category not found');
    return category;
}
async function createCategory(body, imageFile) {
    if (!imageFile)
        throw new errors_1.BadRequestError('No valid file uploaded');
    if (!body.name || !body.slug) {
        throw new errors_1.BadRequestError('Name and slug are required');
    }
    const uploaded = await (0, storage_1.uploadImage)(imageFile, 'categories', 60, 60);
    const category = await categories_repository_1.categoriesRepo.create({
        name: body.name,
        slug: body.slug,
        description: body.description ?? '',
        metaKeywords: body.metaKeywords ?? '',
        metaTitle: body.metaTitle ?? '',
        metaDescription: body.metaDescription ?? '',
        level: body.level ?? 'beginner',
        status: body.status ?? 'active',
        image: uploaded,
    });
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return { success: true, message: 'Category created successfully', data: category };
}
/* ──────────────── Admin: update (PUT, multipart) ──────────────── */
async function updateCategory(id, body, imageFile) {
    const existing = await categories_repository_1.categoriesRepo.findById(id);
    if (!existing)
        throw new errors_1.NotFoundError('Category not found');
    let imageUrl = existing.image;
    if (imageFile) {
        const uploaded = await (0, storage_1.uploadImage)(imageFile, 'categories', 60, 60);
        if (existing.image?.public_id) {
            try {
                await (0, storage_1.deleteImage)(existing.image.public_id);
            }
            catch {
                /* swallow — old asset may already be gone */
            }
        }
        imageUrl = uploaded;
    }
    if (body.name !== undefined)
        existing.name = body.name;
    if (body.slug !== undefined)
        existing.slug = body.slug;
    if (body.description !== undefined)
        existing.description = body.description;
    if (body.metaKeywords !== undefined)
        existing.metaKeywords = body.metaKeywords;
    if (body.metaTitle !== undefined)
        existing.metaTitle = body.metaTitle;
    if (body.metaDescription !== undefined)
        existing.metaDescription = body.metaDescription;
    if (body.level !== undefined)
        existing.level = body.level;
    if (body.status !== undefined)
        existing.status = body.status;
    existing.image = imageUrl;
    await existing.save();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return { success: true, message: 'Category updated successfully', data: existing };
}
/* ──────────────── Admin: delete ──────────────── */
async function deleteCategory(id) {
    const deleted = await categories_repository_1.categoriesRepo.deleteById(id);
    if (!deleted)
        throw new errors_1.NotFoundError('Category not found');
    if (deleted.image?.public_id) {
        try {
            await (0, storage_1.deleteImage)(deleted.image.public_id);
        }
        catch {
            /* swallow */
        }
    }
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return { success: true, message: 'Category deleted successfully' };
}
/* ──────────────── Admin: PATCH (toggle status / field) ──────────────── */
async function patchCategory(id, body) {
    const updated = await categories_repository_1.categoriesRepo.updateById(id, {
        [body.field]: body.status,
    });
    if (!updated)
        throw new errors_1.NotFoundError('Category not found');
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return {
        success: true,
        message: 'Category status updated successfully',
        data: updated,
    };
}
/* ──────────────── Admin: /fetch-category (id+name only) ──────────────── */
async function fetchOptions() {
    const cacheKey = `${CACHE_PREFIX}options`;
    const hit = await (0, client_1.cacheGet)(cacheKey);
    if (hit)
        return hit;
    const data = await categories_repository_1.categoriesRepo.fetchOptions();
    const payload = {
        success: true,
        message: 'Categories fetched successfully',
        data,
    };
    await (0, client_1.cacheSet)(cacheKey, payload, TTL_SECS);
    return payload;
}
/* ──────────────── Storefront: GET /v1/categories?limit= ──────────────── */
async function storefrontList(limitParam) {
    const cacheKey = `${CACHE_PREFIX}storefront:${limitParam ?? 'all'}`;
    const hit = await (0, client_1.cacheGet)(cacheKey);
    if (hit)
        return hit;
    const limit = limitParam === 'all' || !limitParam ? null : Math.max(parseInt(limitParam, 10), 1);
    const categories = await categories_repository_1.categoriesRepo.findAllWithSubAndCounts(limit);
    const payload = { categories };
    await (0, client_1.cacheSet)(cacheKey, payload, TTL_SECS);
    return payload;
}
/* ──────────────── Storefront: GET /v1/categories/featured-categories ──── */
async function featured() {
    const cacheKey = `${CACHE_PREFIX}featured`;
    const hit = await (0, client_1.cacheGet)(cacheKey);
    if (hit)
        return hit;
    const categories = await categories_repository_1.categoriesRepo.findFeatured();
    const payload = { categories };
    await (0, client_1.cacheSet)(cacheKey, payload, TTL_SECS);
    return payload;
}
/* ──────────────── Storefront: GET /v1/categories/sub-categories ──── */
async function withSub(category, limitParam) {
    const limit = limitParam === 'all' || !limitParam ? null : Math.max(parseInt(limitParam, 10), 1);
    const subs = await categories_repository_1.categoriesRepo.findSubsByCategorySlug(category, limit);
    if (!subs)
        throw new errors_1.NotFoundError('Category not found');
    return { categories: subs };
}
/* ──────────────── Storefront: GET /v1/categories/:slug?type= ──── */
async function bySlug(slug, type) {
    if (type === 'category') {
        const cat = await categories_repository_1.categoriesRepo.findBySlug(slug);
        if (!cat)
            throw new errors_1.NotFoundError('Category not found');
        return cat;
    }
    // subcategory branch lives in the subcategories module — keep slim here
    throw new errors_1.BadRequestError('type=subcategory must hit /api/subcategories/slug/:slug');
}
//# sourceMappingURL=categories.service.js.map