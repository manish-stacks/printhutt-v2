/**
 * Storage service. Ported verbatim (logic-wise) from frontend
 * src/lib/cloudinary.ts — the file historically used Cloudinary but the
 * active implementation uses AWS S3. Same upload/delete contract.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = env.AWS_S3_BUCKET_NAME || '';

/** Temp folder jahan customize-uploads jaate hain. S3 lifecycle rule isse
 *  7 din baad auto-delete karta hai (orphan cleanup). */
export const TEMP_FOLDER = 'temp-uploads';
/** Order place hone par images yahan permanent move ho jaati hain. */
export const ORDER_FOLDER = 'orders';

const publicUrl = (key: string): string =>
  `https://s3.${env.AWS_REGION}.amazonaws.com/${BUCKET}/${key}`;

/** URL me se S3 key (public_id) nikaalo. Non-S3 url pe null. */
export const keyFromUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') return null;
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length).split('?')[0] || null;
};

/** Kya ye url humaare temp-uploads/ folder ka hai? */
export const isTempUrl = (url: string): boolean => {
  const key = keyFromUrl(url);
  return !!key && key.startsWith(`${TEMP_FOLDER}/`);
};

/**
 * temp-uploads/ ki image ko orders/ me copy karo (permanent).
 * Naya public url return. Agar url temp ka nahi hai to as-is wapas.
 * Copy fail hone par bhi original url return (order na tuute).
 */
export const moveToPermanent = async (url: string): Promise<string> => {
  const key = keyFromUrl(url);
  if (!key || !key.startsWith(`${TEMP_FOLDER}/`)) return url; // already permanent / external
  const destKey = key.replace(`${TEMP_FOLDER}/`, `${ORDER_FOLDER}/`);
  try {
    await s3.send(
      new CopyObjectCommand({
        Bucket: BUCKET,
        CopySource: `/${BUCKET}/${key}`,
        Key: destKey,
      })
    );
    return publicUrl(destKey);
  } catch (err) {
    console.error('moveToPermanent failed:', err);
    return url; // fallback — original temp url (lifecycle 7 din me delete karega, par order safe)
  }
};

export interface UploadedAsset {
  url: string;
  public_id: string;
  fileType: string;
}

const uploadBuffer = async (
  buffer: Buffer,
  mimeType: string,
  folder: string
): Promise<UploadedAsset> => {
  const fileType = mimeType.split('/')[1] ?? 'bin';
  const key = `${folder}/${uuidv4()}.${fileType}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return {
    url: publicUrl(key),
    public_id: key,
    fileType,
  };
};

/**
 * Multer in-memory file. Width/height kept in signature for backward
 * compatibility with original code (S3 itself does no transformation).
 */
export interface MulterFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

export const uploadImage = async (
  file: MulterFile,
  folderName = 'common',
  _width?: number,
  _height?: number
): Promise<UploadedAsset> => uploadBuffer(file.buffer, file.mimetype, folderName);

export const uploadImageOrder = async (dataUri: string, folderName: string): Promise<UploadedAsset> => {
  const matches = dataUri.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid data URI');
  const mimeType = matches[1] ?? 'application/octet-stream';
  const buffer = Buffer.from(matches[2] ?? '', 'base64');
  return uploadBuffer(buffer, mimeType, folderName);
};

export const reviewImage = async (file: MulterFile): Promise<UploadedAsset> =>
  uploadBuffer(file.buffer, file.mimetype, 'reviews');

export const deleteImage = async (public_id: string): Promise<void> => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: public_id,
    })
  );
};

export const signUrl = async (publicId: string): Promise<string> => {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: publicId });
  return getSignedUrl(s3, command, { expiresIn: 300 });
};
