"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storefrontList = storefrontList;
exports.createGift = createGift;
exports.updateGift = updateGift;
exports.deleteGift = deleteGift;
/** Ports src/app/api/v1/personalized-gifts/* (GET, POST, PUT, DELETE). */
const errors_1 = require("@/utils/errors");
const storage_1 = require("@/utils/storage");
const personalized_gifts_repository_1 = require("./personalized-gifts.repository");
async function storefrontList(sectionType) {
    return personalized_gifts_repository_1.personalizedGiftsRepo.storefrontList(sectionType);
}
async function createGift(body, mediaFile) {
    const type = body.type ?? 'image';
    let media = {};
    if (type === 'video') {
        if (!body.videoUrl)
            throw new errors_1.BadRequestError('Video URL is required');
        media = { videoUrl: body.videoUrl };
    }
    else {
        if (!mediaFile)
            throw new errors_1.BadRequestError('Image is required');
        const uploaded = await (0, storage_1.uploadImage)(mediaFile, 'personalized-gifts', 600, 800);
        media = { media: { url: uploaded.url, public_id: uploaded.public_id, fileType: mediaFile.mimetype } };
    }
    return personalized_gifts_repository_1.personalizedGiftsRepo.create({
        name: body.name,
        badge: body.badge,
        type,
        sectionType: body.sectionType,
        ...media,
        link: body.link,
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive === 'true',
    });
}
async function updateGift(id, body, mediaFile) {
    if (!personalized_gifts_repository_1.personalizedGiftsRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid ID');
    const item = await personalized_gifts_repository_1.personalizedGiftsRepo.findById(id);
    if (!item)
        throw new errors_1.NotFoundError('Item not found');
    const type = body.type ?? item.type;
    if (type === 'video') {
        if (body.videoUrl)
            item.videoUrl = body.videoUrl;
        if (item.media?.public_id) {
            await (0, storage_1.deleteImage)(item.media.public_id).catch(() => undefined);
            item.media = undefined;
        }
    }
    else {
        if (mediaFile && mediaFile.size > 0) {
            if (item.media?.public_id) {
                await (0, storage_1.deleteImage)(item.media.public_id).catch(() => undefined);
            }
            const uploaded = await (0, storage_1.uploadImage)(mediaFile, 'personalized-gifts', 600, 800);
            item.media = { url: uploaded.url, public_id: uploaded.public_id, fileType: mediaFile.mimetype };
        }
        item.videoUrl = undefined;
    }
    item.type = type;
    item.name = body.name || item.name;
    item.badge = body.badge || item.badge;
    item.sectionType = body.sectionType || item.sectionType;
    item.link = body.link || item.link;
    item.sortOrder = Number(body.sortOrder) || 0;
    item.isActive = body.isActive === 'true';
    await item.save();
    return item;
}
async function deleteGift(id) {
    if (!personalized_gifts_repository_1.personalizedGiftsRepo.isValidObjectId(id))
        throw new errors_1.BadRequestError('Invalid ID');
    const item = await personalized_gifts_repository_1.personalizedGiftsRepo.findById(id);
    if (!item)
        throw new errors_1.NotFoundError('Item not found');
    if (item.media?.public_id) {
        await (0, storage_1.deleteImage)(item.media.public_id).catch(() => undefined);
    }
    await item.deleteOne();
}
//# sourceMappingURL=personalized-gifts.service.js.map