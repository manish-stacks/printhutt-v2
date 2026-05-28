"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.byId = byId;
exports.createBlog = createBlog;
exports.updateBlog = updateBlog;
exports.deleteBlog = deleteBlog;
exports.patchBlog = patchBlog;
exports.storefrontList = storefrontList;
exports.bySlug = bySlug;
/**
 * Blogs service. Direct port of:
 *   src/app/api/blog/route.ts            POST + GET (admin)
 *   src/app/api/blog/[id]/route.ts       GET, PUT, DELETE, PATCH
 *   src/app/api/v1/blog-posts/route.ts   GET (storefront)
 *   src/app/api/v1/blog-posts/[slug]/route.ts  GET (slug detail)
 */
const errors_1 = require("@/utils/errors");
const client_1 = require("@/redis/client");
const storage_1 = require("@/utils/storage");
const blogs_repository_1 = require("./blogs.repository");
const CACHE_PREFIX = 'blogs:';
const TTL_SECS = 300;
async function adminList(q) {
    const { blogs, total } = await blogs_repository_1.blogsRepo.adminList(q.page, q.limit, q.search);
    return {
        message: 'Blogs fetched successfully',
        data: blogs,
        pagination: {
            total,
            pages: Math.ceil(total / q.limit),
            page: q.page,
            limit: q.limit,
        },
    };
}
async function byId(id) {
    if (!blogs_repository_1.blogsRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Blog ID');
    const blog = await blogs_repository_1.blogsRepo.findById(id);
    if (!blog)
        throw new errors_1.NotFoundError('Blog not found');
    return blog;
}
async function createBlog(body, imageFile) {
    if (!imageFile)
        throw new errors_1.BadRequestError('No valid file uploaded');
    if (!body.title || !body.slug) {
        throw new errors_1.BadRequestError('Title and slug are required');
    }
    const uploaded = await (0, storage_1.uploadImage)(imageFile, 'blogs', 800, 500);
    const blog = await blogs_repository_1.blogsRepo.create({
        title: body.title,
        slug: body.slug,
        category: body.category ?? '',
        description: body.description ?? '',
        short_description: body.short_description ?? '',
        metaKeywords: body.metaKeywords ?? '',
        metaTitle: body.metaTitle ?? '',
        metaDescription: body.metaDescription ?? '',
        status: body.status ?? 'active',
        image: uploaded,
        author: body.author ?? '',
    });
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return blog;
}
async function updateBlog(id, body, imageFile) {
    if (!blogs_repository_1.blogsRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Blog ID');
    const existing = await blogs_repository_1.blogsRepo.findById(id);
    if (!existing)
        throw new errors_1.NotFoundError('Blog not found');
    let image = existing.image;
    if (imageFile) {
        image = await (0, storage_1.uploadImage)(imageFile, 'blogs', 800, 500);
        const oldPub = existing.image?.public_id;
        if (oldPub)
            await (0, storage_1.deleteImage)(oldPub).catch(() => undefined);
    }
    existing.title = body.title || existing.title;
    existing.slug = body.slug || existing.slug;
    existing.description = body.description || existing.description;
    existing.short_description = body.short_description || existing.short_description;
    existing.metaKeywords = body.metaKeywords || existing.metaKeywords;
    existing.metaTitle = body.metaTitle || existing.metaTitle;
    existing.metaDescription = body.metaDescription || existing.metaDescription;
    existing.author = body.author || existing.author;
    existing.status = body.status || existing.status;
    existing.image = image;
    await existing.save();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return existing;
}
async function deleteBlog(id) {
    if (!blogs_repository_1.blogsRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Blog ID');
    const blog = await blogs_repository_1.blogsRepo.deleteById(id);
    if (!blog)
        throw new errors_1.NotFoundError('Blog not found');
    const oldPub = blog.image?.public_id;
    if (oldPub)
        await (0, storage_1.deleteImage)(oldPub).catch(() => undefined);
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
}
async function patchBlog(id, body) {
    if (!blogs_repository_1.blogsRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Blog ID');
    const updated = await blogs_repository_1.blogsRepo.updateById(id, { status: body.status });
    if (!updated)
        throw new errors_1.NotFoundError('Blog not found');
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return updated;
}
async function storefrontList() {
    const cacheKey = `${CACHE_PREFIX}storefront`;
    const hit = await (0, client_1.cacheGet)(cacheKey);
    if (hit)
        return hit;
    const blogs = await blogs_repository_1.blogsRepo.storefrontList();
    const payload = { success: true, blogs };
    await (0, client_1.cacheSet)(cacheKey, payload, TTL_SECS);
    return payload;
}
async function bySlug(slug) {
    const blog = await blogs_repository_1.blogsRepo.findBySlug(slug);
    if (!blog)
        throw new errors_1.NotFoundError('Blog not found');
    return blog;
}
//# sourceMappingURL=blogs.service.js.map