/**
 * Storage service. Ported verbatim (logic-wise) from frontend
 * src/lib/cloudinary.ts — the file historically used Cloudinary but the
 * active implementation uses AWS S3. Same upload/delete contract.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
    url: `https://s3.${env.AWS_REGION}.amazonaws.com/${BUCKET}/${key}`,
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
