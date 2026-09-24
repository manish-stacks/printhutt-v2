/**
 * Subcategories service. Direct port of:
 *   src/app/api/sub-category/route.ts                GET + POST
 *   src/app/api/sub-category/[id]/route.ts           GET, PUT, DELETE, PATCH
 *   src/app/api/sub-category/fetch-category/route.ts POST (by parent id)
 */
import type { MulterFile, UploadedAsset } from '@/utils/storage';
import { deleteImage, uploadImage } from '@/utils/storage';
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { cacheDelPattern } from '@/redis/client';
import { subcategoriesRepo } from './subcategories.repository';
import type {
  ListSubcategoriesQueryDTO,
  PatchSubcategoryDTO,
} from './subcategories.validation';

const CACHE_PREFIX = 'subcategories:';

/* ──────────────── Admin: paginated list ──────────────── */
export async function adminList(q: ListSubcategoriesQueryDTO): Promise<unknown> {
  const { categories, total } = await subcategoriesRepo.adminList(
    q.page,
    q.limit,
    q.search
  );
  return {
    success: true,
    message: 'Categories fetched successfully',
    categories,
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
  const item = await subcategoriesRepo.findById(id);
  if (!item) throw new NotFoundError('Post not found');
  return item;
}

/* ──────────────── Admin: create (multipart) ──────────────── */
export interface CreateSubcategoryBody {
  name: string;
  slug: string;
  description?: string;
  metaKeywords?: string;
  metaTitle?: string;
  metaDescription?: string;
  parentCategory?: string;
  level?: string;
  status?: boolean;
}

export async function createSubcategory(
  body: CreateSubcategoryBody,
  imageFile: MulterFile | undefined
): Promise<unknown> {
  if (!imageFile) throw new BadRequestError('No valid file uploaded');

  const uploaded: UploadedAsset = await uploadImage(imageFile, 'categories', 60, 60);

  const created = await subcategoriesRepo.create({
    name: body.name,
    slug: body.slug,
    description: body.description,
    metaKeywords: body.metaKeywords,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    parentCategory: body.parentCategory ?? null,
    level: body.level,
    status: body.status === true,
    image: uploaded,
  });

  await cacheDelPattern(`${CACHE_PREFIX}*`);
  await cacheDelPattern('categories:*'); // invalidate parent listings too
  return { success: true, message: 'Category created successfully', data: created };
}

/* ──────────────── Admin: update (PUT, multipart) ──────────────── */
export async function updateSubcategory(
  id: string,
  body: Partial<CreateSubcategoryBody>,
  imageFile: MulterFile | undefined
): Promise<unknown> {
  const existing = await subcategoriesRepo.findById(id);
  if (!existing) throw new NotFoundError('Category not found');

  let imageUrl = existing.image;
  if (imageFile) {
    const uploaded = await uploadImage(imageFile, 'categories', 800, 800);
    if (existing.image?.public_id) {
      try {
        await deleteImage(existing.image.public_id);
      } catch {
        /* swallow */
      }
    }
    imageUrl = uploaded;
  }

  existing.name = body.name ?? existing.name;
  existing.slug = body.slug ?? existing.slug;
  existing.description = body.description ?? existing.description;
  existing.metaKeywords = body.metaKeywords ?? existing.metaKeywords;
  existing.metaTitle = body.metaTitle ?? existing.metaTitle;
  existing.metaDescription = body.metaDescription ?? existing.metaDescription;
  if (body.parentCategory !== undefined) {
    (existing as unknown as { parentCategory: unknown }).parentCategory = body.parentCategory;
  }
  if (body.level !== undefined) {
    (existing as unknown as { level: unknown }).level = body.level;
  }
  existing.status = body.status ?? existing.status;
  existing.image = imageUrl;

  await existing.save();
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  await cacheDelPattern('categories:*');

  return { success: true, message: 'Category updated successfully', data: existing };
}

/* ──────────────── Admin: delete ──────────────── */
export async function deleteSubcategory(id: string): Promise<unknown> {
  const existing = await subcategoriesRepo.findById(id);
  if (!existing) throw new NotFoundError('Category not found');

  if (existing.image?.public_id) {
    try {
      await deleteImage(existing.image.public_id);
    } catch {
      /* swallow */
    }
  }
  await subcategoriesRepo.deleteById(id);
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  await cacheDelPattern('categories:*');

  return { success: true, message: 'Category deleted successfully!' };
}

/* ──────────────── Admin: PATCH status ──────────────── */
export async function patchSubcategory(
  id: string,
  body: PatchSubcategoryDTO
): Promise<unknown> {
  const updated = await subcategoriesRepo.updateById(id, { status: body.status });
  if (!updated) throw new NotFoundError('Category not found');
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return { success: true, message: 'Successfully updated category' };
}

/* ──────────────── Public: fetch subs by parent id ──────────────── */
export async function fetchByParent(parentId: string): Promise<unknown> {
  const categories = await subcategoriesRepo.findByParent(parentId);
  if (!categories || categories.length === 0) {
    throw new NotFoundError('No categories found for the given parent ID');
  }
  return { message: 'Data fetched successfully', category: categories };
}

/* ──────────────── Storefront: GET /api/subcategories/slug/:slug ──── */
export async function bySlug(slug: string): Promise<unknown> {
  const sub = await subcategoriesRepo.findBySlug(slug);
  if (!sub) throw new NotFoundError('Subcategory not found');
  return sub;
}
