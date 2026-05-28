import { z } from 'zod';

/* ─────────── GET /api/products (admin) ─────────── */
export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type AdminListQueryDTO = z.infer<typeof adminListQuerySchema>;

/* ─────────── GET /api/products/storefront ─────────── */
export const storefrontListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  search: z.string().optional(),
  categories: z.string().optional(),
  minPrice: z.coerce.number().default(0),
  maxPrice: z.coerce.number().default(999_999),
  rating: z.coerce.number().int().min(0).max(5).default(0),
  tags: z.string().optional(),
  sort: z.string().default('newest'),
});
export type StorefrontListQueryDTO = z.infer<typeof storefrontListQuerySchema>;

/* ─────────── GET /api/products/by-category (admin) ─────────── */
export const byCategoryQuerySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  limit: z.string().optional(),
});
export type ByCategoryQueryDTO = z.infer<typeof byCategoryQuerySchema>;

/* ─────────── GET /api/products/storefront/category ─────────── */
export const storefrontCategoryQuerySchema = z.object({
  category: z.string().min(1, 'Category slug is required'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});
export type StorefrontCategoryQueryDTO = z.infer<typeof storefrontCategoryQuerySchema>;

/* ─────────── GET /api/products/storefront/sub-category ─────────── */
export const storefrontSubCategoryQuerySchema = z.object({
  subCategory: z.string().min(1, 'Subcategory slug is required'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
});
export type StorefrontSubCategoryQueryDTO = z.infer<typeof storefrontSubCategoryQuerySchema>;

/* ─────────── GET /api/products/storefront/new ─────────── */
export const newArrivalsQuerySchema = z.object({
  limit: z.string().optional(),
  type: z.enum(['customize', 'pre', 'all']).optional(),
});
export type NewArrivalsQueryDTO = z.infer<typeof newArrivalsQuerySchema>;

/* ─────────── GET /api/products/storefront/offers ─────────── */
export const offersQuerySchema = z.object({
  limit: z.string().optional(),
});
export type OffersQueryDTO = z.infer<typeof offersQuerySchema>;

/* ─────────── GET /api/products/storefront/suggest ─────────── */
export const suggestQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
export type SuggestQueryDTO = z.infer<typeof suggestQuerySchema>;

/* ─────────── GET /api/products/storefront/related ─────────── */
export const relatedQuerySchema = z.object({
  category: z.string().min(1),
  limit: z.string().optional(),
});
export type RelatedQueryDTO = z.infer<typeof relatedQuerySchema>;

/* ─────────── PATCH /api/products/:id ─────────── */
export const patchStatusSchema = z.object({
  status: z.boolean(),
});
export type PatchStatusDTO = z.infer<typeof patchStatusSchema>;

/* ─────────── POST /api/products/image-delete ─────────── */
export const imageDeleteSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product id'),
  image: z.object({
    public_id: z.string().min(1),
    url: z.string().optional(),
    fileType: z.string().optional(),
  }),
});
export type ImageDeleteDTO = z.infer<typeof imageDeleteSchema>;
