/** Personalized / Customized gifts — sources: image upload, direct video link (MP4/WEBM URL), YouTube link. */
import { BadRequestError, NotFoundError } from '@/utils/errors';
import { deleteImage, uploadImage, type MulterFile } from '@/utils/storage';
import { personalizedGiftsRepo } from './personalized-gifts.repository';

/** Max items per home section (Customized / Personalized) */
export const MAX_PER_SECTION = 10;

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

const YT_RE = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i;
const isYoutube = (u: string) => YT_RE.test(u);

async function assertSectionHasRoom(sectionType: string, excludeId?: string): Promise<void> {
  const count = await personalizedGiftsRepo.countBySection(sectionType, excludeId);
  if (count >= MAX_PER_SECTION) {
    throw new BadRequestError(`${sectionType} section is full (${MAX_PER_SECTION}/${MAX_PER_SECTION}). Delete an item first.`);
  }
}

const isHttpUrl = (u: string) => /^https?:\/\/\S+$/i.test(u.trim());

async function uploadMedia(file: MulterFile, type: 'image') {
  if (!file.mimetype.startsWith(`${type}/`)) throw new BadRequestError('Please upload a valid image file');
  const up = await uploadImage(file, 'personalized-gifts', 600, 800);
  return { url: up.url, public_id: up.public_id, fileType: file.mimetype };
}

export async function createGift(body: UpsertBody, mediaFile: MulterFile | undefined): Promise<unknown> {
  const type = body.type ?? 'image';
  if (!['image', 'video', 'youtube'].includes(type)) throw new BadRequestError('Invalid type');
  const sectionType = body.sectionType || 'Customized';
  await assertSectionHasRoom(sectionType);

  let extra: Record<string, unknown> = {};
  if (type === 'youtube') {
    if (!body.videoUrl || !isYoutube(body.videoUrl)) throw new BadRequestError('Please enter a valid YouTube link');
    extra = { videoUrl: body.videoUrl.trim() };
  } else if (type === 'video') {
    if (!body.videoUrl || !isHttpUrl(body.videoUrl)) throw new BadRequestError('Please enter a valid video link');
    extra = { videoUrl: body.videoUrl.trim() };
  } else {
    if (!mediaFile || !mediaFile.size) throw new BadRequestError('Image is required');
    extra = { media: await uploadMedia(mediaFile, 'image') };
  }
  return personalizedGiftsRepo.create({
    name: body.name,
    badge: body.badge,
    type,
    sectionType,
    ...extra,
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
  if (!['image', 'video', 'youtube'].includes(type)) throw new BadRequestError('Invalid type');
  const sectionType = body.sectionType || item.sectionType;
  if (sectionType !== item.sectionType) await assertSectionHasRoom(sectionType, id);

  const hasFile = !!mediaFile && mediaFile.size > 0;
  const dropOldMedia = async () => {
    if (item.media?.public_id) await deleteImage(item.media.public_id).catch(() => undefined);
    item.media = undefined;
  };

  if (type === 'youtube') {
    const url = (body.videoUrl || item.videoUrl || '').trim();
    if (!isYoutube(url)) throw new BadRequestError('Please enter a valid YouTube link');
    await dropOldMedia();
    item.videoUrl = url;
  } else if (type === 'video') {
    const url = (body.videoUrl || (item.type === 'video' ? item.videoUrl : '') || '').trim();
    if (!isHttpUrl(url)) throw new BadRequestError('Please enter a valid video link');
    await dropOldMedia();
    item.videoUrl = url;
  } else {
    if (hasFile) {
      await dropOldMedia();
      item.media = await uploadMedia(mediaFile as MulterFile, 'image');
    } else if (item.type !== 'image') {
      throw new BadRequestError('Image is required');
    }
    item.videoUrl = undefined;
  }

  item.type = type;
  item.name = body.name || item.name;
  item.badge = body.badge ?? item.badge;
  item.sectionType = sectionType;
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
