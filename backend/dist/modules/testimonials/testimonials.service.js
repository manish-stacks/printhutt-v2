"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.createTestimonial = createTestimonial;
exports.updateTestimonial = updateTestimonial;
exports.deleteTestimonial = deleteTestimonial;
exports.storefrontRecent = storefrontRecent;
/**
 * Testimonials service. Direct port of:
 *   src/app/api/testimonial/route.ts          GET + POST
 *   src/app/api/testimonial/[id]/route.ts     PUT + DELETE
 *   src/app/api/v1/testimonial/route.ts       GET (storefront — 4 most recent)
 */
const errors_1 = require("@/utils/errors");
const client_1 = require("@/redis/client");
const storage_1 = require("@/utils/storage");
const testimonials_repository_1 = require("./testimonials.repository");
const CACHE_PREFIX = 'testimonials:';
const TTL_SECS = 300;
/* ──────────────── Admin paginated list ──────────────── */
async function adminList(q) {
    const { testimonials, total } = await testimonials_repository_1.testimonialsRepo.adminList(q.page, q.limit, q.search);
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
async function createTestimonial(body, imageFile) {
    if (!imageFile)
        throw new errors_1.BadRequestError('No valid file uploaded');
    const uploaded = await (0, storage_1.uploadImage)(imageFile, 'testimonial', 280, 280);
    const data = await testimonials_repository_1.testimonialsRepo.create({
        name: body.name ?? '',
        image: uploaded,
        feedback: body.feedback ?? '',
        isActive: body.isActive === 'true',
    });
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return data;
}
/* ──────────────── Admin update (multipart) ──────────────── */
async function updateTestimonial(id, body, imageFile) {
    const testimonial = await testimonials_repository_1.testimonialsRepo.findById(id);
    if (!testimonial)
        throw new errors_1.NotFoundError('Testimonial not found');
    if (imageFile) {
        const uploaded = await (0, storage_1.uploadImage)(imageFile, 'testimonial', 280, 280);
        const oldPub = testimonial.image?.public_id;
        if (oldPub)
            await (0, storage_1.deleteImage)(oldPub).catch(() => undefined);
        testimonial.image = uploaded;
    }
    testimonial.name = body.name || testimonial.name;
    testimonial.feedback = body.feedback || testimonial.feedback;
    if (body.isActive !== undefined) {
        testimonial.isActive = body.isActive === 'true' ? true : testimonial.isActive;
    }
    await testimonial.save();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
}
/* ──────────────── Admin delete ──────────────── */
async function deleteTestimonial(id) {
    if (!testimonials_repository_1.testimonialsRepo.isValidObjectId(id)) {
        throw new errors_1.BadRequestError('Invalid Product ID');
    }
    const testimonial = await testimonials_repository_1.testimonialsRepo.findById(id);
    if (!testimonial)
        throw new errors_1.NotFoundError('Testimonial not found');
    const oldPub = testimonial.image?.public_id;
    if (oldPub)
        await (0, storage_1.deleteImage)(oldPub).catch(() => undefined);
    await testimonial.deleteOne();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
}
/* ──────────────── Storefront ──────────────── */
async function storefrontRecent() {
    const cacheKey = `${CACHE_PREFIX}storefront`;
    const hit = await (0, client_1.cacheGet)(cacheKey);
    if (hit)
        return hit;
    const testimonials = await testimonials_repository_1.testimonialsRepo.storefrontRecent();
    const payload = { testimonials, message: 'Successfully fetched testimonials' };
    await (0, client_1.cacheSet)(cacheKey, payload, TTL_SECS);
    return payload;
}
//# sourceMappingURL=testimonials.service.js.map