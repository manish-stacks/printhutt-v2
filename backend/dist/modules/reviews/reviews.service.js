"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.createReview = createReview;
exports.deleteReview = deleteReview;
/**
 * Reviews service. Direct port of:
 *   src/app/api/reviews/route.ts        POST + GET (admin paginated)
 *   src/app/api/reviews/[id]/route.ts   DELETE (admin)
 *
 * Behaviour preserved exactly — review create still pushes the review id
 * into the product's `reviews` array.
 */
const errors_1 = require("@/utils/errors");
const storage_1 = require("@/utils/storage");
const reviews_repository_1 = require("./reviews.repository");
/* ──────────────── 1. Admin list ──────────────── */
async function adminList(q) {
    const { reviews, total } = await reviews_repository_1.reviewsRepo.adminList(q.page, q.limit, q.search);
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
async function createReview(userId, body, images) {
    const review = await reviews_repository_1.reviewsRepo.create({
        orderId: body.orderId,
        rating: body.rating,
        review: body.review,
        userId,
        productId: body.productId,
    });
    if (images.length > 0) {
        const uploads = await Promise.all(images.map((img) => (0, storage_1.uploadImage)(img, 'products', 800, 800)));
        // schema stores `images` as array on the document
        review.images = uploads;
        await review.save();
    }
    await reviews_repository_1.reviewsRepo.pushReviewIdToProduct(body.productId, review._id);
    return review;
}
/* ──────────────── 3. Admin: delete review (with image cleanup) ──────────────── */
async function deleteReview(id) {
    if (!reviews_repository_1.reviewsRepo.isValidObjectId(id)) {
        throw new errors_1.BadRequestError('Invalid Review ID');
    }
    const review = await reviews_repository_1.reviewsRepo.findById(id);
    if (!review)
        throw new errors_1.NotFoundError('Review not found');
    const img = review.images;
    if (img?.public_id) {
        await (0, storage_1.deleteImage)(img.public_id).catch(() => undefined);
    }
    await review.deleteOne();
}
//# sourceMappingURL=reviews.service.js.map