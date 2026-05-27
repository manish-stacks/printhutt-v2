import multer from 'multer';

/**
 * Multer config — memory storage. Files arrive as Buffer in `req.file` /
 * `req.files`; the storage.ts utility then uploads them to S3.
 *
 * 25 MB per-file limit (raise per-route as needed).
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

/* Common product-creation fields (kept for legacy callers) */
export const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 20 },
]);

/* Any-field handler — used by product create/update where variant images
   arrive as variant_image_<i>_<j>, variant_thumbnail_<i>, etc. */
export const uploadAny = upload.any();
