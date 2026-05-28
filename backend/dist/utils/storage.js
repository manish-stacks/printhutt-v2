"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signUrl = exports.deleteImage = exports.reviewImage = exports.uploadImageOrder = exports.uploadImage = void 0;
/**
 * Storage service. Ported verbatim (logic-wise) from frontend
 * src/lib/cloudinary.ts — the file historically used Cloudinary but the
 * active implementation uses AWS S3. Same upload/delete contract.
 */
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const s3 = new client_s3_1.S3Client({
    region: env_1.env.AWS_REGION,
    credentials: {
        accessKeyId: env_1.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: env_1.env.AWS_SECRET_ACCESS_KEY || '',
    },
});
const BUCKET = env_1.env.AWS_S3_BUCKET_NAME || '';
const uploadBuffer = async (buffer, mimeType, folder) => {
    const fileType = mimeType.split('/')[1] ?? 'bin';
    const key = `${folder}/${(0, uuid_1.v4)()}.${fileType}`;
    await s3.send(new client_s3_1.PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
    }));
    return {
        url: `https://s3.${env_1.env.AWS_REGION}.amazonaws.com/${BUCKET}/${key}`,
        public_id: key,
        fileType,
    };
};
const uploadImage = async (file, folderName = 'common', _width, _height) => uploadBuffer(file.buffer, file.mimetype, folderName);
exports.uploadImage = uploadImage;
const uploadImageOrder = async (dataUri, folderName) => {
    const matches = dataUri.match(/^data:(.+);base64,(.+)$/);
    if (!matches)
        throw new Error('Invalid data URI');
    const mimeType = matches[1] ?? 'application/octet-stream';
    const buffer = Buffer.from(matches[2] ?? '', 'base64');
    return uploadBuffer(buffer, mimeType, folderName);
};
exports.uploadImageOrder = uploadImageOrder;
const reviewImage = async (file) => uploadBuffer(file.buffer, file.mimetype, 'reviews');
exports.reviewImage = reviewImage;
const deleteImage = async (public_id) => {
    await s3.send(new client_s3_1.DeleteObjectCommand({
        Bucket: BUCKET,
        Key: public_id,
    }));
};
exports.deleteImage = deleteImage;
const signUrl = async (publicId) => {
    const command = new client_s3_1.PutObjectCommand({ Bucket: BUCKET, Key: publicId });
    return (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 300 });
};
exports.signUrl = signUrl;
//# sourceMappingURL=storage.js.map