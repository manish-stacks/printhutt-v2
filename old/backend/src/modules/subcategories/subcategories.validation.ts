import { z } from 'zod';

/* ─────────── GET /api/subcategories (admin paginated list) ─────────── */
export const listSubcategoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListSubcategoriesQueryDTO = z.infer<typeof listSubcategoriesQuerySchema>;

/* ─────────── POST /api/subcategories/fetch ─────────── */
export const fetchByParentSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid parent id'),
});
export type FetchByParentDTO = z.infer<typeof fetchByParentSchema>;

/* ─────────── PATCH /api/subcategories/:id ─────────── */
export const patchSubcategorySchema = z.object({
  status: z.union([z.string(), z.boolean()]),
});
export type PatchSubcategoryDTO = z.infer<typeof patchSubcategorySchema>;
