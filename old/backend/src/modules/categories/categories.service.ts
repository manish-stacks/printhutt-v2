/**
 * Categories service. Direct port of:
 *   src/app/api/category/route.ts                    GET + POST
 *   src/app/api/category/[id]/route.ts               GET, PUT, DELETE, PATCH
 *   src/app/api/category/fetch-category/route.ts     GET (id+name options)
 *   src/app/api/v1/categories/route.ts               GET (storefront w/ subs)
 *   src/app/api/v1/categories/featured-categories/route.ts
 *   src/app/api/v1/categories/sub-categories/route.ts
 *   src/app/api/v1/categories/[slug]/route.ts        GET (slug + type)
 */
import type { MulterFile, UploadedAsset } from '@/utils/storage';
import { deleteImage, uploadImage } from '@/utils/storage';
import {
  BadRequestError,
  NotFoundError,
} from '@/utils/errors';
import { cacheDelPattern, cacheGet, cacheSet } from '@/redis/client';
import { categoriesRepo } from './categories.repository';
import type {
  ListCategoriesQueryDTO,
  PatchCategoryDTO,
} from './categories.validation';

const CACHE_PREFIX = 'categories:';
const TTL_SECS = 300;

/* ──────────────── Admin: paginated list ──────────────── */
export async function adminList(q: ListCategoriesQueryDTO): Promise<unknown> {
  const { categories, total } = await categoriesRepo.adminList(
    q.page,
    q.limit,
    q.search
  );
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
export async function byId(id: string): Promise<unknown> {
  const category = await categoriesRepo.findById(id);
  if (!category) throw new NotFoundError('Category not found');
  return category;
}

/* ──────────────── Admin: create (multipart) ──────────────── */
export interface CreateCategoryBody {
  name: string;
  slug: string;
  description?: string;
  metaKeywords?: string;
  metaTitle?: string;
  metaDescription?: string;
  level?: string;
  status?: string;
}

export async function createCategory(
  body: CreateCategoryBody,
  imageFile: MulterFile | undefined
): Promise<unknown> {
  if (!imageFile) throw new BadRequestError('No valid file uploaded');
  if (!body.name || !body.slug) {
    throw new BadRequestError('Name and slug are required');
  }

  const uploaded: UploadedAsset = await uploadImage(imageFile, 'categories', 60, 60);

  const category = await categoriesRepo.create({
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

  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return { success: true, message: 'Category created successfully', data: category };
}

/* ──────────────── Admin: update (PUT, multipart) ──────────────── */
export async function updateCategory(
  id: string,
  body: Partial<CreateCategoryBody>,
  imageFile: MulterFile | undefined
): Promise<unknown> {
  const existing = await categoriesRepo.findById(id);
  if (!existing) throw new NotFoundError('Category not found');

  let imageUrl = existing.image;
  if (imageFile) {
    const uploaded = await uploadImage(imageFile, 'categories', 60, 60);
    if (existing.image?.public_id) {
      try {
        await deleteImage(existing.image.public_id);
      } catch {
        /* swallow — old asset may already be gone */
      }
    }
    imageUrl = uploaded;
  }

  if (body.name !== undefined) existing.name = body.name;
  if (body.slug !== undefined) existing.slug = body.slug;
  if (body.description !== undefined) existing.description = body.description;
  if (body.metaKeywords !== undefined) existing.metaKeywords = body.metaKeywords;
  if (body.metaTitle !== undefined) existing.metaTitle = body.metaTitle;
  if (body.metaDescription !== undefined) existing.metaDescription = body.metaDescription;
  if (body.level !== undefined) existing.level = body.level;
  if (body.status !== undefined) existing.status = body.status;
  existing.image = imageUrl;

  await existing.save();
  await cacheDelPattern(`${CACHE_PREFIX}*`);

  return { success: true, message: 'Category updated successfully', data: existing };
}

/* ──────────────── Admin: delete ──────────────── */
export async function deleteCategory(id: string): Promise<unknown> {
  const deleted = await categoriesRepo.deleteById(id);
  if (!deleted) throw new NotFoundError('Category not found');

  if (deleted.image?.public_id) {
    try {
      await deleteImage(deleted.image.public_id);
    } catch {
      /* swallow */
    }
  }
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return { success: true, message: 'Category deleted successfully' };
}

/* ──────────────── Admin: PATCH (toggle status / field) ──────────────── */
export async function patchCategory(
  id: string,
  body: PatchCategoryDTO
): Promise<unknown> {
  const updated = await categoriesRepo.updateById(id, {
    [body.field]: body.status,
  });
  if (!updated) throw new NotFoundError('Category not found');
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return {
    success: true,
    message: 'Category status updated successfully',
    data: updated,
  };
}

/* ──────────────── Admin: /fetch-category (id+name only) ──────────────── */
export async function fetchOptions(): Promise<unknown> {
  const cacheKey = `${CACHE_PREFIX}options`;
  const hit = await cacheGet<unknown>(cacheKey);
  if (hit) return hit;

  const data = await categoriesRepo.fetchOptions();
  const payload = {
    success: true,
    message: 'Categories fetched successfully',
    data,
  };
  await cacheSet(cacheKey, payload, TTL_SECS);
  return payload;
}

/* ──────────────── Storefront: GET /v1/categories?limit= ──────────────── */
export async function storefrontList(limitParam?: string): Promise<unknown> {
  const cacheKey = `${CACHE_PREFIX}storefront:${limitParam ?? 'all'}`;
  const hit = await cacheGet<unknown>(cacheKey);
  if (hit) return hit;

  const limit =
    limitParam === 'all' || !limitParam ? null : Math.max(parseInt(limitParam, 10), 1);
  const categories = await categoriesRepo.findAllWithSubAndCounts(limit);
  const payload = { categories };
  await cacheSet(cacheKey, payload, TTL_SECS);
  return payload;
}

/* ──────────────── Storefront: GET /v1/categories/featured-categories ──── */
export async function featured(): Promise<unknown> {
  const cacheKey = `${CACHE_PREFIX}featured`;
  const hit = await cacheGet<unknown>(cacheKey);
  if (hit) return hit;
  const categories = await categoriesRepo.findFeatured();
  const payload = { categories };
  await cacheSet(cacheKey, payload, TTL_SECS);
  return payload;
}

/* ──────────────── Storefront: GET /v1/categories/sub-categories ──── */
export async function withSub(category: string, limitParam?: string): Promise<unknown> {
  const limit =
    limitParam === 'all' || !limitParam ? null : Math.max(parseInt(limitParam, 10), 1);
  const subs = await categoriesRepo.findSubsByCategorySlug(category, limit);
  if (!subs) throw new NotFoundError('Category not found');
  return { categories: subs };
}

/* ──────────────── Storefront: GET /v1/categories/:slug?type= ──── */
export async function bySlug(
  slug: string,
  type: 'category' | 'subcategory'
): Promise<unknown> {
  if (type === 'category') {
    const cat = await categoriesRepo.findBySlug(slug);
    if (!cat) throw new NotFoundError('Category not found');
    return cat;
  }
  // subcategory branch lives in the subcategories module — keep slim here
  throw new BadRequestError('type=subcategory must hit /api/subcategories/slug/:slug');
}
