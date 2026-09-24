/**
 * Blogs service. Direct port of:
 *   src/app/api/blog/route.ts            POST + GET (admin)
 *   src/app/api/blog/[id]/route.ts       GET, PUT, DELETE, PATCH
 *   src/app/api/v1/blog-posts/route.ts   GET (storefront)
 *   src/app/api/v1/blog-posts/[slug]/route.ts  GET (slug detail)
 */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { cacheDelPattern, cacheGet, cacheSet } from '@/redis/client';
import {
  deleteImage,
  uploadImage,
  type MulterFile,
  type UploadedAsset,
} from '@/utils/storage';
import { blogsRepo } from './blogs.repository';
import type {
  ListBlogsQueryDTO,
  PatchBlogDTO,
  StorefrontBlogsQueryDTO,
} from './blogs.validation';

const CACHE_PREFIX = 'blogs:';
const TTL_SECS = 300;

export async function adminList(q: ListBlogsQueryDTO): Promise<unknown> {
  const { blogs, total } = await blogsRepo.adminList(q.page, q.limit, q.search);
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

export async function byId(id: string): Promise<unknown> {
  if (!blogsRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Blog ID');
  const blog = await blogsRepo.findById(id);
  if (!blog) throw new NotFoundError('Blog not found');
  return blog;
}

export interface BlogBody {
  title?: string;
  slug?: string;
  category?: string;
  description?: string;
  short_description?: string;
  metaKeywords?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: string;
  author?: string;
}

export async function createBlog(
  body: BlogBody,
  imageFile: MulterFile | undefined
): Promise<unknown> {
  if (!imageFile) throw new BadRequestError('No valid file uploaded');
  if (!body.title || !body.slug) {
    throw new BadRequestError('Title and slug are required');
  }
  const uploaded: UploadedAsset = await uploadImage(imageFile, 'blogs', 800, 500);
  const blog = await blogsRepo.create({
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
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return blog;
}

export async function updateBlog(
  id: string,
  body: BlogBody,
  imageFile: MulterFile | undefined
): Promise<unknown> {
  if (!blogsRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Blog ID');
  const existing = await blogsRepo.findById(id);
  if (!existing) throw new NotFoundError('Blog not found');

  let image = existing.image;
  if (imageFile) {
    image = await uploadImage(imageFile, 'blogs', 800, 500);
    const oldPub = (existing.image as { public_id?: string } | undefined)?.public_id;
    if (oldPub) await deleteImage(oldPub).catch(() => undefined);
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
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return existing;
}

export async function deleteBlog(id: string): Promise<void> {
  if (!blogsRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Blog ID');
  const blog = await blogsRepo.deleteById(id);
  if (!blog) throw new NotFoundError('Blog not found');
  const oldPub = (blog.image as { public_id?: string } | undefined)?.public_id;
  if (oldPub) await deleteImage(oldPub).catch(() => undefined);
  await cacheDelPattern(`${CACHE_PREFIX}*`);
}

export async function patchBlog(id: string, body: PatchBlogDTO): Promise<unknown> {
  if (!blogsRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Blog ID');
  const updated = await blogsRepo.updateById(id, { status: body.status });
  if (!updated) throw new NotFoundError('Blog not found');
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return updated;
}



export async function storefrontList(q: StorefrontBlogsQueryDTO): Promise<unknown> {
  const cacheKey = `${CACHE_PREFIX}storefront:${q.page}:${q.limit}:${q.search}`;
  const hit = await cacheGet<unknown>(cacheKey);
  if (hit) return hit;

  const { blogs, total } = await blogsRepo.storefrontList(q.page, q.limit, q.search);
  const payload = {
    success: true,
    blogs,
    pagination: {
      total,
      pages: Math.ceil(total / q.limit),
      page: q.page,
      limit: q.limit,
    },
  };
  await cacheSet(cacheKey, payload, TTL_SECS);
  return payload;
}

export async function bySlug(slug: string): Promise<unknown> {
  const blog = await blogsRepo.findBySlug(slug);
  if (!blog) throw new NotFoundError('Blog not found');

  const b = blog as {
    _id: { toString(): string };
    category?: { _id?: { toString(): string } } | string | null;
  };

  let categoryId: string | null = null;
  if (b.category) {
    if (typeof b.category === 'string') {
      categoryId = b.category;
    } else if (b.category._id) {
      categoryId = b.category._id.toString();
    }
  }

  const relatedBlogs = categoryId
    ? await blogsRepo.findRelatedBlogs(categoryId, b._id.toString()).catch(() => [])
    : [];

  return { success: true, blogPost: blog, relatedBlogs };
}
