/**
 * BlogCategories service. Ports src/app/api/blog/category/route.ts (GET+POST)
 * and src/app/api/blog/category/[id]/route.ts (PUT+DELETE).
 */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { blogCategoriesRepo } from './blog-categories.repository';
import type { ListQueryDTO } from './blog-categories.validation';

export async function adminList(q: ListQueryDTO): Promise<unknown> {
  const { blogCategories, total } = await blogCategoriesRepo.adminList(q.page, q.limit, q.search);
  return {
    blogCategories,
    pagination: { total, pages: Math.ceil(total / q.limit), page: q.page, limit: q.limit },
  };
}

export async function createBlogCategory(name: string, isActive: boolean): Promise<unknown> {
  return blogCategoriesRepo.create({ name, isActive });
}

export async function updateBlogCategory(id: string, name?: string, isActive?: string): Promise<void> {
  const cat = await blogCategoriesRepo.findById(id);
  if (!cat) throw new NotFoundError('Blog category not found');
  cat.name = name || cat.name;
  if (isActive !== undefined) cat.isActive = isActive === 'true' ? true : cat.isActive;
  await cat.save();
}

export async function deleteBlogCategory(id: string): Promise<void> {
  if (!blogCategoriesRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Blog Category ID');
  const cat = await blogCategoriesRepo.findById(id);
  if (!cat) throw new NotFoundError('Blog category not found');
  await cat.deleteOne();
}
