"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.createSlider = createSlider;
exports.updateSlider = updateSlider;
exports.deleteSlider = deleteSlider;
exports.storefrontActive = storefrontActive;
/**
 * Sliders service. Direct port of:
 *   src/app/api/slider/route.ts         GET + POST (multipart)
 *   src/app/api/slider/[id]/route.ts    PUT + DELETE (multipart for PUT)
 *   src/app/api/v1/slider/route.ts      GET (storefront — active only, 4 items)
 */
const errors_1 = require("@/utils/errors");
const client_1 = require("@/redis/client");
const storage_1 = require("@/utils/storage");
const sliders_repository_1 = require("./sliders.repository");
const CACHE_PREFIX = 'sliders:';
const TTL_SECS = 300;
/* ──────────────── Admin paginated list ──────────────── */
async function adminList(q) {
    const { sliders, total } = await sliders_repository_1.slidersRepo.adminList(q.page, q.limit, q.search);
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
async function createSlider(body, imageFile) {
    if (!imageFile) {
        throw new errors_1.BadRequestError('Slider is required and must be a file');
    }
    const uploaded = await (0, storage_1.uploadImage)(imageFile, 'slider', 1900, 550);
    const slider = await sliders_repository_1.slidersRepo.create({
        title: body.title ?? '',
        imageUrl: uploaded,
        link: body.link ?? '',
        isActive: body.isActive === 'true',
        level: body.level ?? '',
    });
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return slider;
}
/* ──────────────── Admin: update ──────────────── */
async function updateSlider(id, body, imageFile) {
    const slider = await sliders_repository_1.slidersRepo.findById(id);
    if (!slider)
        throw new errors_1.NotFoundError('Slider not found');
    if (imageFile) {
        const uploaded = await (0, storage_1.uploadImage)(imageFile, 'slider', 1900, 550);
        const oldPub = slider.imageUrl?.public_id;
        if (oldPub)
            await (0, storage_1.deleteImage)(oldPub).catch(() => undefined);
        slider.imageUrl = uploaded;
    }
    if (body.title !== undefined)
        slider.title = body.title || slider.title;
    if (body.link !== undefined)
        slider.link = body.link || slider.link;
    if (body.isActive !== undefined) {
        slider.isActive =
            body.isActive || slider.isActive;
    }
    if (body.level !== undefined) {
        slider.level = body.level || slider.level;
    }
    await slider.save();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return slider;
}
/* ──────────────── Admin: delete ──────────────── */
async function deleteSlider(id) {
    if (!sliders_repository_1.slidersRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Slider ID');
    const slider = await sliders_repository_1.slidersRepo.findById(id);
    if (!slider)
        throw new errors_1.NotFoundError('Slider not found');
    const oldPub = slider.imageUrl?.public_id;
    if (oldPub)
        await (0, storage_1.deleteImage)(oldPub).catch(() => undefined);
    await slider.deleteOne();
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
}
/* ──────────────── Storefront: active sliders ──────────────── */
async function storefrontActive() {
    const cacheKey = `${CACHE_PREFIX}storefront`;
    const hit = await (0, client_1.cacheGet)(cacheKey);
    if (hit)
        return hit;
    const sliders = await sliders_repository_1.slidersRepo.storefrontActive();
    const payload = { sliders, message: 'data fetch successfully' };
    await (0, client_1.cacheSet)(cacheKey, payload, TTL_SECS);
    return payload;
}
//# sourceMappingURL=sliders.service.js.map