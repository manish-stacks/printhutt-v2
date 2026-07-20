/** Ports src/app/api/get-signed-url/route.ts — returns S3 PUT-signed URL. */
import { BadRequestError } from '@/utils/errors';
import {
  signUrl,
  uploadImage,
  uploadImageOrder,
  TEMP_FOLDER,
  type MulterFile,
  type UploadedAsset,
} from '@/utils/storage';

export async function getSignedUrl(public_id: string): Promise<string> {
  if (!public_id) throw new BadRequestError('public_id not found');
  return signUrl(public_id);
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Customize-flow uploads. File (multer) YA base64 dataURI dono accept.
 * Sab kuch temp-uploads/ me jaata hai; order place hone par permanent move hota hai.
 * Orphan (order na bane) images ko S3 lifecycle rule 7 din me delete kar deta hai.
 */
export async function uploadCustomImage(
  file: MulterFile | undefined,
  dataUri: string | undefined
): Promise<UploadedAsset> {
  if (file) {
    if (!ALLOWED.includes(file.mimetype)) {
      throw new BadRequestError('Only JPG, PNG, WEBP, GIF images allowed');
    }
    return uploadImage(file, TEMP_FOLDER);
  }
  if (dataUri && dataUri.startsWith('data:image')) {
    return uploadImageOrder(dataUri, TEMP_FOLDER);
  }
  throw new BadRequestError('No image provided');
}
