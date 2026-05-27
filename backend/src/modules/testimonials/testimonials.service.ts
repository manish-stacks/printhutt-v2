/**
 * Testimonials service. Direct port of:
 *   src/app/api/testimonial/route.ts          GET + POST
 *   src/app/api/testimonial/[id]/route.ts     PUT + DELETE
 *   src/app/api/v1/testimonial/route.ts       GET (storefront — 4 most recent)
 */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { cacheDelPattern, cacheGet, cacheSet } from '@/redis/client';
import {
  deleteImage,
  uploadImage,
  type MulterFile,
  type UploadedAsset,
} from '@/utils/storage';
import { testimonialsRepo } from './testimonials.repository';
import type { ListTestimonialsQueryDTO } from './testimonials.validation';

const CACHE_PREFIX = 'testimonials:';
const TTL_SECS = 300;

/* ──────────────── Admin paginated list ──────────────── */
export async function adminList(q: ListTestimonialsQueryDTO): Promise<unknown> {
  const { testimonials, total } = await testimonialsRepo.adminList(
    q.page,
    q.limit,
    q.search
  );
  return {
    testimonials,
    pagination: {
      total,
      pages: Math.ceil(total / q.limit),
      page: q.page,
      limit: q.limit,
    },
  };
}

/* ──────────────── Admin create (multipart) ──────────────── */
export interface CreateTestimonialBody {
  name?: string;
  feedback?: string;
  isActive?: string;
}

export async function createTestimonial(
  body: CreateTestimonialBody,
  imageFile: MulterFile | undefined
): Promise<unknown> {
  if (!imageFile) throw new BadRequestError('No valid file uploaded');
  const uploaded: UploadedAsset = await uploadImage(imageFile, 'testimonial', 280, 280);
  const data = await testimonialsRepo.create({
    name: body.name ?? '',
    image: uploaded,
    feedback: body.feedback ?? '',
    isActive: body.isActive === 'true',
  });
  await cacheDelPattern(`${CACHE_PREFIX}*`);
  return data;
}

/* ──────────────── Admin update (multipart) ──────────────── */
export async function updateTestimonial(
  id: string,
  body: CreateTestimonialBody,
  imageFile: MulterFile | undefined
): Promise<void> {
  const testimonial = await testimonialsRepo.findById(id);
  if (!testimonial) throw new NotFoundError('Testimonial not found');

  if (imageFile) {
    const uploaded = await uploadImage(imageFile, 'testimonial', 280, 280);
    const oldPub = (testimonial.image as { public_id?: string } | undefined)?.public_id;
    if (oldPub) await deleteImage(oldPub).catch(() => undefined);
    testimonial.image = uploaded;
  }

  testimonial.name = body.name || testimonial.name;
  testimonial.feedback = body.feedback || testimonial.feedback;
  if (body.isActive !== undefined) {
    testimonial.isActive = body.isActive === 'true' ? true : testimonial.isActive;
  }
  await testimonial.save();
  await cacheDelPattern(`${CACHE_PREFIX}*`);
}

/* ──────────────── Admin delete ──────────────── */
export async function deleteTestimonial(id: string): Promise<void> {
  if (!testimonialsRepo.isValidObjectId(id)) {
    throw new BadRequestError('Invalid Product ID');
  }
  const testimonial = await testimonialsRepo.findById(id);
  if (!testimonial) throw new NotFoundError('Testimonial not found');

  const oldPub = (testimonial.image as { public_id?: string } | undefined)?.public_id;
  if (oldPub) await deleteImage(oldPub).catch(() => undefined);
  await testimonial.deleteOne();
  await cacheDelPattern(`${CACHE_PREFIX}*`);
}

/* ──────────────── Storefront ──────────────── */
export async function storefrontRecent(): Promise<unknown> {
  const cacheKey = `${CACHE_PREFIX}storefront`;
  const hit = await cacheGet<unknown>(cacheKey);
  if (hit) return hit;
  const testimonials = await testimonialsRepo.storefrontRecent();
  const payload = { testimonials, message: 'Successfully fetched testimonials' };
  await cacheSet(cacheKey, payload, TTL_SECS);
  return payload;
}
