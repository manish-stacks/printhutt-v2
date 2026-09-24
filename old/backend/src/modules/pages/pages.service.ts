import { BadRequestError, NotFoundError } from '@/utils/errors';
import { cacheDelPattern, cacheGet, cacheSet } from '@/redis/client';
import { pagesRepo } from './pages.repository';
import { PAGE_DEFAULTS } from './pages.defaults';
import type { UpdatePageDTO } from './pages.validation';

const CACHE_PREFIX = 'pages:';
const TTL_SECS = 600;

export async function getPageBySlug(slug: string): Promise<unknown> {
  if (!PAGE_DEFAULTS[slug]) throw new BadRequestError('Unknown page slug');

  const cacheKey = `${CACHE_PREFIX}${slug}`;
  const hit = await cacheGet<unknown>(cacheKey);
  if (hit) return hit;

  const page = await pagesRepo.findOrCreate(slug);
  if (!page) throw new NotFoundError('Page not found');

  const payload = { success: true, page };
  await cacheSet(cacheKey, payload, TTL_SECS);
  return payload;
}

export async function listPagesAdmin(): Promise<unknown> {
  // Ensure all 4 pages exist with default content
  await Promise.all(
    Object.keys(PAGE_DEFAULTS).map((slug) => pagesRepo.findOrCreate(slug))
  );
  const pages = await pagesRepo.list();
  return { success: true, pages };
}

export async function updatePage(slug: string, body: UpdatePageDTO): Promise<unknown> {
  if (!PAGE_DEFAULTS[slug]) throw new BadRequestError('Unknown page slug');
  const updated = await pagesRepo.update(slug, body);
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return { success: true, message: 'Page updated successfully', page: updated };
}