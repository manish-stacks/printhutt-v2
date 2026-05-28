"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugTypeQuerySchema = exports.subListQuerySchema = exports.storefrontListQuerySchema = exports.slugParamSchema = exports.idParamSchema = exports.patchCategorySchema = exports.listCategoriesQuerySchema = void 0;
const zod_1 = require("zod");
/* ─────────── GET /api/categories (admin paginated list) ─────────── */
exports.listCategoriesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
/* ─────────── PATCH /api/categories/:id ─────────── */
exports.patchCategorySchema = zod_1.z.object({
    status: zod_1.z.union([zod_1.z.string(), zod_1.z.boolean()]),
    field: zod_1.z.string().min(1),
});
/* ─────────── ID param ─────────── */
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});
/* ─────────── Slug param (storefront) ─────────── */
exports.slugParamSchema = zod_1.z.object({
    slug: zod_1.z.string().min(1),
});
/* ─────────── GET /api/categories/storefront (?limit=) ─────────── */
exports.storefrontListQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().optional(),
});
/* ─────────── GET /api/categories/with-sub (?limit=&category=) ─────────── */
exports.subListQuerySchema = zod_1.z.object({
    limit: zod_1.z.string().optional(),
    category: zod_1.z.string().min(1),
});
/* ─────────── GET /api/categories/slug/:slug?type= ─────────── */
exports.slugTypeQuerySchema = zod_1.z.object({
    type: zod_1.z.enum(['category', 'subcategory']),
});
//# sourceMappingURL=categories.validation.js.map