/**
 * Reviews service. Direct port of:
 *   src/app/api/reviews/route.ts        POST + GET (admin paginated)
 *   src/app/api/reviews/[id]/route.ts   DELETE (admin)
 *
 * Behaviour preserved exactly — review create still pushes the review id
 * into the product's `reviews` array.
 */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { deleteImage, uploadImage, type MulterFile, type UploadedAsset } from '@/utils/storage';
import { reviewsRepo } from './reviews.repository';
import type { ListReviewsQueryDTO } from './reviews.validation';

/* ──────────────── 1. Admin list ──────────────── */
export async function adminList(q: ListReviewsQueryDTO): Promise<unknown> {
  const { reviews, total } = await reviewsRepo.adminList(q.page, q.limit, q.search);
  return {
    reviews,
    pagination: {
      total,
      pages: Math.ceil(total / q.limit),
      page: q.page,
      limit: q.limit,
    },
  };
}

/* ──────────────── 2. Create review (multipart with images) ──────────────── */
export interface CreateReviewBody {
  orderId: string;
  rating: string | number;
  review: string;
  productId: string;
}

export async function createReview(
  userId: string,
  body: CreateReviewBody,
  images: MulterFile[]
): Promise<unknown> {
  const review = await reviewsRepo.create({
    orderId: body.orderId,
    rating: body.rating,
    review: body.review,
    userId,
    productId: body.productId,
  });

  if (images.length > 0) {
    const uploads: UploadedAsset[] = await Promise.all(
      images.map((img) => uploadImage(img, 'products', 800, 800))
    );
    // schema stores `images` as array on the document
    (review as unknown as { images: UploadedAsset[] }).images = uploads;
    await (review as unknown as { save: () => Promise<unknown> }).save();
  }

  await reviewsRepo.pushReviewIdToProduct(body.productId, review._id);
  return review;
}

/* ──────────────── 3. Admin: delete review (with image cleanup) ──────────────── */
export async function deleteReview(id: string): Promise<void> {
  if (!reviewsRepo.isValidObjectId(id)) {
    throw new BadRequestError('Invalid Review ID');
  }
  const review = await reviewsRepo.findById(id);
  if (!review) throw new NotFoundError('Review not found');

  const img = (review as unknown as { images?: { public_id?: string } }).images;
  if (img?.public_id) {
    await deleteImage(img.public_id).catch(() => undefined);
  }
  await review.deleteOne();
}
