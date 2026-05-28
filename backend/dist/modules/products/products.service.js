"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.byId = byId;
exports.byIdStorefront = byIdStorefront;
exports.bySlugStorefront = bySlugStorefront;
exports.byCategory = byCategory;
exports.storefrontList = storefrontList;
exports.storefrontByCategorySlug = storefrontByCategorySlug;
exports.storefrontBySubCategorySlug = storefrontBySubCategorySlug;
exports.newArrivals = newArrivals;
exports.withOffers = withOffers;
exports.suggest = suggest;
exports.topRelated = topRelated;
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.deleteProduct = deleteProduct;
exports.patchStatus = patchStatus;
exports.copyProduct = copyProduct;
exports.deleteSingleImage = deleteSingleImage;
/**
 * Product service — full port of:
 *   src/app/api/product/route.ts                            GET + POST
 *   src/app/api/product/[id]/route.ts                       GET, PUT, DELETE, PATCH
 *   src/app/api/product/[id]/copy/route.ts                  POST (copy)
 *   src/app/api/product/by_category/route.ts                GET
 *   src/app/api/product/image-delate/route.ts               POST (delete one image)
 *   src/app/api/v1/products/route.ts                        GET (storefront filter)
 *   src/app/api/v1/products/[id]/route.ts                   GET
 *   src/app/api/v1/products/category/route.ts               GET
 *   src/app/api/v1/products/sub-category/route.ts           GET
 *   src/app/api/v1/products/new-arrivals/route.ts           GET
 *   src/app/api/v1/products/offers/route.ts                 GET
 *   src/app/api/v1/products/search-suggestions/route.ts     GET
 *   src/app/api/v1/products/top-related-products/route.ts   GET
 *
 * Behaviour preserved exactly — same filter logic, sort cases, pagination
 * shape and response keys.
 */
const mongoose_1 = __importDefault(require("mongoose"));
const storage_1 = require("@/utils/storage");
const errors_1 = require("@/utils/errors");
const client_1 = require("@/redis/client");
const products_repository_1 = require("./products.repository");
const CACHE_PREFIX = 'products:';
const TTL_SECS = 300;
/* ──────────────── 1. Admin list ──────────────── */
async function adminList(q) {
    const { products, total } = await products_repository_1.productRepo.adminList(q.page, q.limit, q.search);
    return {
        products,
        pagination: {
            total,
            pages: Math.ceil(total / q.limit),
            page: q.page,
            limit: q.limit,
        },
    };
}
/* ──────────────── 2. Single read ──────────────── */
async function byId(id) {
    if (!products_repository_1.productRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const product = await products_repository_1.productRepo.findById(id);
    if (!product)
        throw new errors_1.NotFoundError('Product not found');
    return product;
}
async function byIdStorefront(id) {
    if (!products_repository_1.productRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    console.log('Finding product by ID:', id);
    const product = await products_repository_1.productRepo.findByIdFull(id);
    if (!product)
        throw new errors_1.NotFoundError('Product not found');
    return product;
}
async function bySlugStorefront(slug) {
    const product = await products_repository_1.productRepo.findBySlug(slug);
    if (!product)
        throw new errors_1.NotFoundError('Product not found');
    return product;
}
/* ──────────────── 3. Admin: by category id ──────────────── */
async function byCategory(q) {
    const limit = q.limit === 'all' || !q.limit ? null : Math.max(parseInt(q.limit, 10), 1);
    const products = await products_repository_1.productRepo.findByCategoryId(q.id, limit).lean();
    return { products };
}
/* ──────────────── 4. Storefront list (filters + sort + paginate) ──────────────── */
async function storefrontList(q) {
    const cacheKey = `${CACHE_PREFIX}storefront:${JSON.stringify(q)}`;
    const cached = await (0, client_1.cacheGet)(cacheKey);
    if (cached)
        return cached;
    const products = await products_repository_1.productRepo.storefrontBase().exec();
    let filtered = [...products];
    // SEARCH
    if (q.search) {
        const s = q.search.toLowerCase();
        filtered = filtered.filter((p) => {
            const titleMatch = p.title?.toLowerCase().includes(s) ?? false;
            const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(s)) ?? false;
            const shortDescMatch = p.short_description?.toLowerCase().includes(s) ?? false;
            const skuMatch = p.sku?.toLowerCase().includes(s) ?? false;
            const categoryMatch = p.category?.name?.toLowerCase().includes(s) ?? false;
            const subCategoryMatch = p.subcategory?.name?.toLowerCase().includes(s) ?? false;
            return (titleMatch ||
                tagMatch ||
                shortDescMatch ||
                skuMatch ||
                categoryMatch ||
                subCategoryMatch);
        });
    }
    // CATEGORY (note: original matches by category NAME, not id — preserved)
    const categories = q.categories?.split(',').filter(Boolean) ?? [];
    if (categories.length > 0) {
        filtered = filtered.filter((p) => p.category?.name ? categories.includes(p.category.name) : false);
    }
    // PRICE
    filtered = filtered.filter((p) => p.price >= q.minPrice && p.price <= q.maxPrice);
    // RATING
    if (q.rating > 0) {
        filtered = filtered.filter((p) => p.rating >= q.rating);
    }
    // TAGS
    const tags = q.tags?.split(',').filter(Boolean) ?? [];
    if (tags.length > 0) {
        filtered = filtered.filter((p) => p.tags?.some((t) => tags.includes(t)) ?? false);
    }
    // SORT
    switch (q.sort) {
        case 'featured':
            filtered = filtered.sort((a, b) => (Number(b.featured) || 0) - (Number(a.featured) || 0));
            break;
        case 'newest':
            filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
        case 'price-asc':
            filtered = filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filtered = filtered.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filtered = filtered.sort((a, b) => b.rating - a.rating);
            break;
        default:
            filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
    }
    // PAGINATE
    const perPage = 12;
    const total = filtered.length;
    const totalPages = Math.ceil(total / perPage);
    const offset = (q.page - 1) * perPage;
    const paginated = filtered.slice(offset, offset + perPage);
    const payload = {
        success: true,
        products: paginated,
        totalProducts: total,
        pagination: { page: q.page, perPage, pages: totalPages, total, totalPages },
    };
    await (0, client_1.cacheSet)(cacheKey, payload, TTL_SECS);
    return payload;
}
/* ──────────────── 5. Storefront: by category slug ──────────────── */
async function storefrontByCategorySlug(q) {
    const limit = q.limit === 'all' || !q.limit ? 48 : Math.max(parseInt(q.limit, 10) || 10, 1);
    const result = await products_repository_1.productRepo.findByCategorySlug(q.category, limit);
    if (!result)
        throw new errors_1.NotFoundError('Category not found');
    return { success: true, products: result.products };
}
/* ──────────────── 6. Storefront: by sub-category slug ──────────────── */
async function storefrontBySubCategorySlug(q) {
    const page = q.page ? Math.max(1, parseInt(q.page, 10)) : 1;
    const limit = q.limit === 'all' || !q.limit ? 40 : Math.max(1, parseInt(q.limit, 10));
    const result = await products_repository_1.productRepo.findBySubCategorySlug(q.subCategory, page, limit);
    if (!result)
        throw new errors_1.NotFoundError('Subcategory not found');
    return {
        success: true,
        products: result.products,
        pagination: {
            total: result.total,
            page,
            limit,
            totalPages: Math.ceil(result.total / limit),
        },
    };
}
/* ──────────────── 7. Storefront: new arrivals ──────────────── */
async function newArrivals(q) {
    const limit = q.limit === 'all' || !q.limit ? 10 : Math.max(parseInt(q.limit, 10) || 10, 1);
    const matchQuery = { status: true };
    if (q.type === 'customize')
        matchQuery.isCustomize = true;
    if (q.type === 'pre')
        matchQuery.isCustomize = false;
    const products = await products_repository_1.productRepo.randomSampleWithCategoryAndSub(matchQuery, limit);
    return { success: true, products };
}
/* ──────────────── 8. Storefront: products with offers ──────────────── */
async function withOffers(q) {
    const limit = q.limit === 'all' || !q.limit ? 10 : Math.max(parseInt(q.limit, 10) || 10, 1);
    const products = await products_repository_1.productRepo.withOffers(limit);
    return { success: true, products };
}
/* ──────────────── 9. Storefront: search suggestions ──────────────── */
async function suggest(q) {
    const products = await products_repository_1.productRepo.suggest((q.q ?? '').trim(), q.limit);
    return { success: true, products };
}
/* ──────────────── 10. Storefront: top related ──────────────── */
async function topRelated(q) {
    const limit = q.limit === 'all' || !q.limit ? null : Math.max(parseInt(q.limit, 10), 1);
    const products = await products_repository_1.productRepo.topRelated(q.category, limit);
    return { products };
}
/* ──────────────── 11. Create product (multipart) ──────────────── */
async function createProduct(body, thumbnail, galleryImages, variantFiles) {
    if (!thumbnail)
        throw new errors_1.BadRequestError('Thumbnail is required');
    // Parse JSON-encoded form fields
    const offers = body.offers
        ? JSON.parse(body.offers).map((id) => new mongoose_1.default.Types.ObjectId(id))
        : [];
    const tags = body.tags ? JSON.parse(body.tags) : [];
    const variantBase = body.varient ? JSON.parse(body.varient) : [];
    // First save (no images yet) so we have an _id for variant folder names
    const productData = buildProductData(body, offers, tags, variantBase);
    const product = await products_repository_1.productRepo.create(productData);
    if (!product)
        throw new errors_1.BadRequestError('Failed to create product');
    // Upload thumbnail + gallery in parallel
    const [thumbnailUpload, ...uploadedGallery] = await Promise.all([
        (0, storage_1.uploadImage)(thumbnail, 'products/thumbnails', 800, 800),
        ...galleryImages.map((img) => (0, storage_1.uploadImage)(img, 'products', 800, 800)),
    ]);
    product.thumbnail = thumbnailUpload;
    product.images = uploadedGallery;
    // Variant images
    if (variantBase.length > 0) {
        const updatedVariants = await Promise.all(variantBase.map(async (variant, vIdx) => {
            const tFile = variantFiles[`variant_thumbnail_${vIdx}`];
            let variantThumb;
            if (tFile) {
                variantThumb = await (0, storage_1.uploadImage)(tFile, `products/variants/${String(product._id)}`, 600, 600);
            }
            const variantImages = [];
            const prefix = `variant_image_${vIdx}_`;
            for (const [key, file] of Object.entries(variantFiles)) {
                if (key.startsWith(prefix)) {
                    // NOTE: original code referenced an undefined `id` here — fixed to use product._id
                    const uploaded = await (0, storage_1.uploadImage)(file, `products/variants/${String(product._id)}`, 600, 600);
                    variantImages.push(uploaded);
                }
            }
            return {
                ...variant,
                ...(variantThumb ? { thumbnail: variantThumb } : {}),
                images: variantImages,
            };
        }));
        product.varient = updatedVariants;
    }
    await product.save();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return { success: true, message: 'Product created successfully', data: product };
}
/* ──────────────── 12. Update product (multipart) ──────────────── */
async function updateProduct(id, body, thumbnail, galleryImages, variantFiles) {
    if (!products_repository_1.productRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const product = await products_repository_1.productRepo.findById(id);
    if (!product)
        throw new errors_1.NotFoundError('Product not found');
    const offers = body.offers
        ? JSON.parse(body.offers).map((oid) => new mongoose_1.default.Types.ObjectId(oid))
        : [];
    const tags = body.tags ? JSON.parse(body.tags) : [];
    // Build updates respecting "preserve existing if not provided" semantics
    const u = product;
    const getOr = (key, fallback, transform) => {
        const v = body[key];
        if (v === undefined)
            return fallback;
        return transform ? transform(v) : v;
    };
    const getBool = (key, fallback) => body[key] !== undefined ? body[key] === 'true' : fallback;
    u.title = getOr('title', u.title);
    u.slug = getOr('slug', u.slug);
    u.description = getOr('description', u.description);
    u.short_description = getOr('short_description', u.short_description);
    u.category = getOr('category', u.category);
    u.subcategory = getOr('subcategory', u.subcategory);
    u.price = body.price !== undefined ? parseFloat(body.price) : u.price;
    u.discountType = getOr('discountType', u.discountType);
    u.discountPrice =
        body.discountPrice !== undefined ? parseFloat(body.discountPrice) : u.discountPrice;
    u.rating = body.rating !== undefined ? parseInt(body.rating, 10) : u.rating;
    u.stock = body.stock !== undefined ? parseInt(body.stock, 10) : u.stock;
    u.tags = tags.length > 0 ? tags : u.tags;
    u.sku = getOr('sku', u.sku);
    u.weight = body.weight !== undefined ? parseFloat(body.weight) : u.weight;
    u.availabilityStatus = getOr('availabilityStatus', u.availabilityStatus);
    u.dimensions = getOr('dimensions', u.dimensions);
    u.warrantyInformation = getOr('warrantyInformation', u.warrantyInformation);
    u.shippingInformation = getOr('shippingInformation', u.shippingInformation);
    u.returnPolicy = getOr('returnPolicy', u.returnPolicy);
    u.demoVideo = getOr('demoVideo', u.demoVideo);
    u.imgAlt = getOr('imgAlt', u.imgAlt);
    u.status = getBool('status', Boolean(u.status));
    u.ishome = getBool('ishome', Boolean(u.ishome));
    u.trending = getBool('trending', Boolean(u.trending));
    u.hot = getBool('hot', Boolean(u.hot));
    u.sale = getBool('sale', Boolean(u.sale));
    u.new = getBool('new', Boolean(u.new));
    u.isTextBox = getBool('isTextBox', Boolean(u.isTextBox));
    u.isImageBox = getBool('isImageBox', Boolean(u.isImageBox));
    u.isCustomize = getBool('isCustomize', Boolean(u.isCustomize));
    u.customizeLink = getOr('customizeLink', u.customizeLink);
    u.meta = {
        meta_title: body.meta_title ?? u.meta?.meta_title,
        meta_keywords: body.meta_keywords ?? u.meta?.meta_keywords,
        meta_description: body.meta_description ?? u.meta?.meta_description,
    };
    u.shippingFee =
        body.shippingFee !== undefined ? parseFloat(body.shippingFee) : u.shippingFee;
    u.offers = offers.length > 0 ? offers : u.offers;
    u.isVarientStatus = getBool('isVarientStatus', Boolean(u.isVarientStatus));
    // Thumbnail
    if (thumbnail) {
        const oldPub = u.thumbnail?.public_id;
        if (oldPub)
            await (0, storage_1.deleteImage)(oldPub).catch(() => undefined);
        u.thumbnail = await (0, storage_1.uploadImage)(thumbnail, 'products/thumbnails', 800, 800);
    }
    // Gallery (append new)
    if (galleryImages.length > 0) {
        const uploaded = await Promise.all(galleryImages.map((img) => (0, storage_1.uploadImage)(img, 'products', 800, 800)));
        const existing = u.images ?? [];
        u.images = [...existing, ...uploaded];
    }
    const variantBase = body.varient
        ? JSON.parse(body.varient)
        : (u.varient ?? []).map((v) => (v.toObject?.() ?? v));
    const updatedVariants = await Promise.all(variantBase.map(async (variant, vIdx) => {
        let variantThumbnail = variant.thumbnail;
        const tFile = variantFiles[`variant_thumbnail_${vIdx}`];
        if (tFile) {
            const oldPub = variant.thumbnail?.public_id;
            if (oldPub)
                await (0, storage_1.deleteImage)(oldPub).catch(() => undefined);
            variantThumbnail = await (0, storage_1.uploadImage)(tFile, `products/variants/${id}`, 600, 600);
        }
        const newVariantImages = [];
        const prefix = `variant_image_${vIdx}_`;
        for (const [key, file] of Object.entries(variantFiles)) {
            if (key.startsWith(prefix)) {
                const uploaded = await (0, storage_1.uploadImage)(file, `products/variants/${id}`, 600, 600);
                newVariantImages.push(uploaded);
            }
        }
        // Existing images: keep only ones with http URLs (matches original)
        const existingImages = (variant.images ?? []).filter((img) => img.url && img.url.startsWith('http'));
        const allImages = newVariantImages.length > 0
            ? [...existingImages, ...newVariantImages]
            : existingImages;
        return {
            ...(variant._id ? { _id: variant._id } : {}),
            size: variant.size,
            color: variant.color,
            price: variant.price,
            discountPrice: variant.discountPrice,
            discountType: variant.discountType,
            stock: variant.stock,
            isMainProduct: variant.isMainProduct ?? false,
            thumbnail: variantThumbnail,
            images: allImages,
        };
    }));
    u.varient = updatedVariants;
    const saved = await product.save();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return { success: true, message: 'Product updated successfully', data: saved };
}
/* ──────────────── 13. Delete product (cascades image deletes) ──────────────── */
async function deleteProduct(id) {
    if (!products_repository_1.productRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const product = await products_repository_1.productRepo.findById(id);
    if (!product)
        throw new errors_1.NotFoundError('Product not found');
    const deletePromises = [];
    const images = (product.images ?? []);
    for (const img of images) {
        if (img.public_id)
            deletePromises.push((0, storage_1.deleteImage)(img.public_id));
    }
    const thumb = product.thumbnail;
    if (thumb?.public_id)
        deletePromises.push((0, storage_1.deleteImage)(thumb.public_id));
    const variants = (product.varient ?? []);
    for (const v of variants) {
        if (v.thumbnail?.public_id)
            deletePromises.push((0, storage_1.deleteImage)(v.thumbnail.public_id));
        for (const img of v.images ?? []) {
            if (img.public_id)
                deletePromises.push((0, storage_1.deleteImage)(img.public_id));
        }
    }
    await Promise.all(deletePromises.map((p) => p.catch(() => undefined)));
    await products_repository_1.productRepo.deleteById(id);
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return { success: true, message: 'Product deleted successfully' };
}
/* ──────────────── 14. PATCH status ──────────────── */
async function patchStatus(id, status) {
    if (!products_repository_1.productRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const updated = await products_repository_1.productRepo.patchStatus(id, status);
    if (!updated)
        throw new errors_1.NotFoundError('Product not found');
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return { success: true, message: 'Status updated', data: updated };
}
/* ──────────────── 15. Copy product ──────────────── */
async function copyProduct(id) {
    if (!products_repository_1.productRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Product ID');
    const original = (await products_repository_1.productRepo.findByIdRaw(id));
    if (!original)
        throw new errors_1.NotFoundError('Product not found');
    // Strip non-copyable fields
    const { _id: _omit_id, slug, thumbnail: _omit_thumb, images: _omit_images, createdAt: _omit_c, updatedAt: _omit_u, __v: _omit_v, sku: _omit_sku, reviews: _omit_reviews, rating: _omit_rating, ...rest } = original;
    const timestamp = Date.now();
    const copied = await products_repository_1.productRepo.create({
        ...rest,
        title: `${String(rest.title)} (Copy)`,
        slug: `${String(slug)}-copy`,
        sku: String(timestamp),
        thumbnail: null,
        images: [],
        reviews: [],
        rating: 5,
        status: false,
        varient: (rest.varient ?? []).map((v) => ({
            ...v,
            _id: undefined,
            thumbnail: null,
            images: [],
        })),
    });
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return {
        success: true,
        message: 'Product copied successfully',
        data: { _id: copied._id, title: copied.title },
    };
}
/* ──────────────── 16. Image delete (single) ──────────────── */
async function deleteSingleImage(body) {
    const product = await products_repository_1.productRepo.findById(body.productId);
    if (!product)
        throw new errors_1.NotFoundError('Product not found');
    const images = (product.images ?? []);
    const idx = images.findIndex((img) => img.public_id === body.image.public_id);
    if (idx === -1)
        throw new errors_1.NotFoundError('Image not found in product');
    await (0, storage_1.deleteImage)(body.image.public_id).catch(() => undefined);
    images.splice(idx, 1);
    await product.save();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return { success: true, message: 'Image deleted successfully' };
}
/* ──────────────── helper: build product data block (create) ──────────────── */
function buildProductData(body, offers, tags, varient) {
    return {
        title: body.title ?? '',
        slug: body.slug ?? '',
        description: body.description ?? '',
        short_description: body.short_description ?? '',
        category: body.category ?? '',
        subcategory: body.subcategory ?? '',
        price: parseFloat(body.price ?? '0'),
        discountType: body.discountType ?? '',
        discountPrice: parseFloat(body.discountPrice ?? '0'),
        rating: parseInt(body.rating ?? '0', 10),
        stock: parseInt(body.stock ?? '0', 10),
        tags,
        sku: body.sku ?? '',
        weight: parseFloat(body.weight ?? '0'),
        availabilityStatus: body.availabilityStatus ?? 'in_stock',
        dimensions: body.dimensions ?? '',
        warrantyInformation: body.warrantyInformation ?? '',
        shippingInformation: body.shippingInformation ?? '',
        returnPolicy: body.returnPolicy ?? '',
        demoVideo: body.demoVideo ?? '',
        imgAlt: body.imgAlt ?? '',
        status: body.status === 'true',
        ishome: body.ishome === 'true',
        trending: body.trending === 'true',
        isTextBox: body.isTextBox === 'true',
        isImageBox: body.isImageBox === 'true',
        hot: body.hot === 'true',
        sale: body.sale === 'true',
        new: body.new === 'true',
        isCustomize: body.isCustomize === 'true',
        customizeLink: body.customizeLink ?? '',
        meta: {
            meta_title: body.meta_title ?? '',
            meta_keywords: body.meta_keywords ?? '',
            meta_description: body.meta_description ?? '',
        },
        shippingFee: parseFloat(body.shippingFee ?? '0'),
        offers,
        isVarientStatus: body.isVarientStatus === 'true',
        varient,
    };
}
//# sourceMappingURL=products.service.js.map