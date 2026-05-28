"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchSubcategorySchema = exports.fetchByParentSchema = exports.listSubcategoriesQuerySchema = void 0;
const zod_1 = require("zod");
/* ─────────── GET /api/subcategories (admin paginated list) ─────────── */
exports.listSubcategoriesQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(10),
    search: zod_1.z.string().default(''),
});
/* ─────────── POST /api/subcategories/fetch ─────────── */
exports.fetchByParentSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[a-f\d]{24}$/i, 'Invalid parent id'),
});
/* ─────────── PATCH /api/subcategories/:id ─────────── */
exports.patchSubcategorySchema = zod_1.z.object({
    status: zod_1.z.union([zod_1.z.string(), zod_1.z.boolean()]),
});
//# sourceMappingURL=subcategories.validation.js.map