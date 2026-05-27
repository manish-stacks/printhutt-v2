/**
 * Sliders service. Direct port of:
 *   src/app/api/slider/route.ts         GET + POST (multipart)
 *   src/app/api/slider/[id]/route.ts    PUT + DELETE (multipart for PUT)
 *   src/app/api/v1/slider/route.ts      GET (storefront — active only, 4 items)
 */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { cacheDelPattern, cacheGet, cacheSet } from '@/redis/client';
import {
  deleteImage,
  uploadImage,
  type MulterFile,
  type UploadedAsset,
} from '@/utils/storage';
import { slidersRepo } from './sliders.repository';
import type { ListSlidersQueryDTO } from './sliders.validation';

const CACHE_PREFIX = 'sliders:';
const TTL_SECS = 300;

/* ──────────────── Admin paginated list ──────────────── */
export async function adminList(q: ListSlidersQueryDTO): Promise<unknown> {
  const { sliders, total } = await slidersRepo.adminList(q.page, q.limit, q.search);
  return {
    sliders,
    pagination: {
      total,
      pages: Math.ceil(total / q.limit),
      page: q.page,
      limit: q.limit,
    },
  };
}

/* ──────────────── Admin: create ──────────────── */
export interface CreateSliderBody {
  title?: string;
  link?: string;
  isActive?: string;
  level?: string;
}

export async function createSlider(
  body: CreateSliderBody,
  imageFile: MulterFile | undefined
): Promise<unknown> {
  if (!imageFile) {
    throw new BadRequestError('Slider is required and must be a file');
  }
  const uploaded: UploadedAsset = await uploadImage(imageFile, 'slider', 1900, 550);
  const slider = await slidersRepo.create({
    title: body.title ?? '',
    imageUrl: uploaded,
    link: body.link ?? '',
    isActive: body.isActive === 'true',
    level: body.level ?? '',
  });
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return slider;
}

/* ──────────────── Admin: update ──────────────── */
export async function updateSlider(
  id: string,
  body: CreateSliderBody,
  imageFile: MulterFile | undefined
): Promise<unknown> {
  const slider = await slidersRepo.findById(id);
  if (!slider) throw new NotFoundError('Slider not found');

  if (imageFile) {
    const uploaded = await uploadImage(imageFile, 'slider', 1900, 550);
    const oldPub = (slider.imageUrl as { public_id?: string } | undefined)?.public_id;
    if (oldPub) await deleteImage(oldPub).catch(() => undefined);
    slider.imageUrl = uploaded;
  }

  if (body.title !== undefined) slider.title = body.title || slider.title;
  if (body.link !== undefined) slider.link = body.link || slider.link;
  if (body.isActive !== undefined) {
    (slider as unknown as { isActive: unknown }).isActive =
      body.isActive || slider.isActive;
  }
  if (body.level !== undefined) {
    (slider as unknown as { level: unknown }).level = body.level || slider.level;
  }
  await slider.save();
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return slider;
}

/* ──────────────── Admin: delete ──────────────── */
export async function deleteSlider(id: string): Promise<void> {
  if (!slidersRepo.isValidObjectId(id)) throw new BadRequestError('Invalid Slider ID');
  const slider = await slidersRepo.findById(id);
  if (!slider) throw new NotFoundError('Slider not found');

  const oldPub = (slider.imageUrl as { public_id?: string } | undefined)?.public_id;
  if (oldPub) await deleteImage(oldPub).catch(() => undefined);
  await slider.deleteOne();
  await cacheDelPattern(`${CACHE_PREFIX}*`);
}

/* ──────────────── Storefront: active sliders ──────────────── */
export async function storefrontActive(): Promise<unknown> {
  const cacheKey = `${CACHE_PREFIX}storefront`;
  const hit = await cacheGet<unknown>(cacheKey);
  if (hit) return hit;
  const sliders = await slidersRepo.storefrontActive();
  const payload = { sliders, message: 'data fetch successfully' };
  await cacheSet(cacheKey, payload, TTL_SECS);
  return payload;
}
