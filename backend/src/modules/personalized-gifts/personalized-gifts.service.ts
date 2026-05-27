/** Ports src/app/api/v1/personalized-gifts/* (GET, POST, PUT, DELETE). */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { deleteImage, uploadImage, type MulterFile } from '@/utils/storage';
import { personalizedGiftsRepo } from './personalized-gifts.repository';

export async function storefrontList(sectionType: string): Promise<unknown> {
  return personalizedGiftsRepo.storefrontList(sectionType);
}

export interface UpsertBody {
  type?: string;
  name?: string;
  badge?: string;
  sectionType?: string;
  link?: string;
  sortOrder?: string;
  isActive?: string;
  videoUrl?: string;
}

export async function createGift(body: UpsertBody, mediaFile: MulterFile | undefined): Promise<unknown> {
  const type = body.type ?? 'image';
  let media: Record<string, unknown> = {};
  if (type === 'video') {
    if (!body.videoUrl) throw new BadRequestError('Video URL is required');
    media = { videoUrl: body.videoUrl };
  } else {
    if (!mediaFile) throw new BadRequestError('Image is required');
    const uploaded = await uploadImage(mediaFile, 'personalized-gifts', 600, 800);
    media = { media: { url: uploaded.url, public_id: uploaded.public_id, fileType: mediaFile.mimetype } };
  }
  return personalizedGiftsRepo.create({
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

export async function updateGift(id: string, body: UpsertBody, mediaFile: MulterFile | undefined): Promise<unknown> {
  if (!personalizedGiftsRepo.isValidObjectId(id)) throw new BadRequestError('Invalid ID');
  const item = await personalizedGiftsRepo.findById(id);
  if (!item) throw new NotFoundError('Item not found');

  const type = body.type ?? item.type;
  if (type === 'video') {
    if (body.videoUrl) item.videoUrl = body.videoUrl;
    if (item.media?.public_id) {
      await deleteImage(item.media.public_id).catch(() => undefined);
      item.media = undefined;
    }
  } else {
    if (mediaFile && mediaFile.size > 0) {
      if (item.media?.public_id) {
        await deleteImage(item.media.public_id).catch(() => undefined);
      }
      const uploaded = await uploadImage(mediaFile, 'personalized-gifts', 600, 800);
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

export async function deleteGift(id: string): Promise<void> {
  if (!personalizedGiftsRepo.isValidObjectId(id)) throw new BadRequestError('Invalid ID');
  const item = await personalizedGiftsRepo.findById(id);
  if (!item) throw new NotFoundError('Item not found');
  if (item.media?.public_id) {
    await deleteImage(item.media.public_id).catch(() => undefined);
  }
  await item.deleteOne();
}
