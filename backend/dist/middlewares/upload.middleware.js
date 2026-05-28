"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAny = exports.uploadFields = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
/**
 * Multer config — memory storage. Files arrive as Buffer in `req.file` /
 * `req.files`; the storage.ts utility then uploads them to S3.
 *
 * 25 MB per-file limit (raise per-route as needed).
 */
exports.upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024 },
});
/* Common product-creation fields (kept for legacy callers) */
exports.uploadFields = exports.upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 20 },
]);
/* Any-field handler — used by product create/update where variant images
   arrive as variant_image_<i>_<j>, variant_thumbnail_<i>, etc. */
exports.uploadAny = exports.upload.any();
//# sourceMappingURL=upload.middleware.js.map