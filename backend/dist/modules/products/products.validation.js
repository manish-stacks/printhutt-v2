"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageDeleteSchema = exports.patchStatusSchema = exports.relatedQuerySchema = exports.suggestQuerySchema = exports.offersQuerySchema = exports.newArrivalsQuerySchema = exports.storefrontSubCategoryQuerySchema = exports.storefrontCategoryQuerySchema = exports.byCategoryQuerySchema = exports.storefrontListQuerySchema = exports.adminListQuerySchema = void 0;
const zod_1 = require("zod");
/* ─────────── GET /api/products (admin) ─────────── */
exports.adminListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
/* ─────────── GET /api/products/storefront ─────────── */
exports.storefrontListQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    search: zod_1.z.string().optional(),
    categories: zod_1.z.string().optional(),
    minPrice: zod_1.z.coerce.number().default(0),
    maxPrice: zod_1.z.coerce.number().default(999_999),
    rating: zod_1.z.coerce.number().int().min(0).max(5).default(0),
    tags: zod_1.z.string().optional(),
    sort: zod_1.z.string().default('newest'),
});
/* ─────────── GET /api/products/by-category (admin) ─────────── */
exports.byCategoryQuerySchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Category ID is required'),
    limit: zod_1.z.string().optional(),
});
/* ─────────── GET /api/products/storefront/category ─────────── */
exports.storefrontCategoryQuerySchema = zod_1.z.object({
    category: zod_1.z.string().min(1, 'Category slug is required'),
    limit: zod_1.z.string().optional(),
});
/* ─────────── GET /api/products/storefront/sub-category ─────────── */
exports.storefrontSubCategoryQuerySchema = zod_1.z.object({
    subCategory: zod_1.z.string().min(1, 'Subcategory slug is required'),
    page: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional(),
});
/* ─────────── GET /api/products/storefront/new ─────────── */
exports.newArrivalsQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().optional(),
    type: zod_1.z.enum(['customize', 'pre', 'all']).optional(),
});
/* ─────────── GET /api/products/storefront/offers ─────────── */
exports.offersQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().optional(),
});
/* ─────────── GET /api/products/storefront/suggest ─────────── */
exports.suggestQuerySchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
});
/* ─────────── GET /api/products/storefront/related ─────────── */
exports.relatedQuerySchema = zod_1.z.object({
    category: zod_1.z.string().min(1),
    limit: zod_1.z.string().optional(),
});
/* ─────────── PATCH /api/products/:id ─────────── */
exports.patchStatusSchema = zod_1.z.object({
    status: zod_1.z.boolean(),
});
/* ─────────── POST /api/products/image-delete ─────────── */
exports.imageDeleteSchema = zod_1.z.object({
    productId: zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id'),
    image: zod_1.z.object({
        public_id: zod_1.z.string().min(1),
        url: zod_1.z.string().optional(),
        fileType: zod_1.z.string().optional(),
    }),
});
//# sourceMappingURL=products.validation.js.map