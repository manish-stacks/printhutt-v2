import { z } from 'zod';

/* ─────────── GET /api/categories (admin paginated list) ─────────── */
export const listCategoriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListCategoriesQueryDTO = z.infer<typeof listCategoriesQuerySchema>;

/* ─────────── PATCH /api/categories/:id ─────────── */
export const patchCategorySchema = z.object({
  status: z.union([z.string(), z.boolean()]),
  field: z.string().min(1),
});
export type PatchCategoryDTO = z.infer<typeof patchCategorySchema>;

/* ─────────── ID param ─────────── */
export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id'),
});

/* ─────────── Slug param (storefront) ─────────── */
export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

/* ─────────── GET /api/categories/storefront (?limit=) ─────────── */
export const storefrontListQuerySchema = z.object({
  limit: z.string().optional(),
});
export type StorefrontListQueryDTO = z.infer<typeof storefrontListQuerySchema>;

/* ─────────── GET /api/categories/with-sub (?limit=&category=) ─────────── */
export const subListQuerySchema = z.object({
  limit: z.string().optional(),
  category: z.string().min(1),
});
export type SubListQueryDTO = z.infer<typeof subListQuerySchema>;

/* ─────────── GET /api/categories/slug/:slug?type= ─────────── */
export const slugTypeQuerySchema = z.object({
  type: z.enum(['category', 'subcategory']),
});
export type SlugTypeQueryDTO = z.infer<typeof slugTypeQuerySchema>;
