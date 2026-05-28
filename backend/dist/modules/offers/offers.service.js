"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.byId = byId;
exports.createOffer = createOffer;
exports.updateOffer = updateOffer;
exports.deleteOffer = deleteOffer;
exports.fetchOptions = fetchOptions;
/**
 * Offers service. Direct port of:
 *   src/app/api/offer/route.ts            POST + GET (admin paginated)
 *   src/app/api/offer/[id]/route.ts       GET, PUT, DELETE (admin)
 *   src/app/api/offer/get-all/route.ts    GET (id+title options)
 */
const errors_1 = require("@/utils/errors");
const client_1 = require("@/redis/client");
const offers_repository_1 = require("./offers.repository");
const CACHE_PREFIX = 'offers:';
const TTL_SECS = 300;
/* ──────────────── Admin paginated list ──────────────── */
async function adminList(q) {
    const { offers, total } = await offers_repository_1.offersRepo.adminList(q.page, q.limit, q.search);
    return {
        message: 'Offers fetched successfully',
        data: offers,
        pagination: {
            total,
            pages: Math.ceil(total / q.limit),
            page: q.page,
            limit: q.limit,
        },
    };
}
/* ──────────────── Admin single read ──────────────── */
async function byId(id) {
    if (!offers_repository_1.offersRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Offer ID');
    const offer = await offers_repository_1.offersRepo.findById(id);
    if (!offer)
        throw new errors_1.NotFoundError('Offer not found');
    return offer;
}
/* ──────────────── Admin create ──────────────── */
async function createOffer(body) {
    const offer = await offers_repository_1.offersRepo.create({ ...body });
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return offer;
}
/* ──────────────── Admin update ──────────────── */
async function updateOffer(id, patch) {
    if (!offers_repository_1.offersRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Offer ID');
    const updated = await offers_repository_1.offersRepo.updateById(id, patch);
    if (!updated)
        throw new errors_1.NotFoundError('Offer not found');
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
    return updated;
}
/* ──────────────── Admin delete ──────────────── */
async function deleteOffer(id) {
    if (!offers_repository_1.offersRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid Offer ID');
    const deleted = await offers_repository_1.offersRepo.deleteById(id);
    if (!deleted)
        throw new errors_1.NotFoundError('Offer not found');
    await (0, client_1.cacheDelPattern)(`${CACHE_PREFIX}*`);
}
/* ──────────────── Public: get-all (id + title) ──────────────── */
async function fetchOptions() {
    const cacheKey = `${CACHE_PREFIX}options`;
    const hit = await (0, client_1.cacheGet)(cacheKey);
    if (hit)
        return hit;
    const offers = await offers_repository_1.offersRepo.fetchOptions();
    await (0, client_1.cacheSet)(cacheKey, offers, TTL_SECS);
    return offers;
}
//# sourceMappingURL=offers.service.js.map