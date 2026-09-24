import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdmin, optionalAuth } from '@/middlewares/auth.middleware';
import { upload } from '@/middlewares/upload.middleware';
import * as controller from './upload.controller';

const router = Router();

/* Customize photo uploads — abuse se bachne ke liye tight rate-limit.
   ~40 uploads / 10 min / IP (9-photo product ke liye headroom). */
const customUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many uploads, please slow down' },
});

router.get('/signed-url', ...requireAdmin, controller.getSignedUrl);

/* POST /api/upload/custom-image
   Guest + logged-in dono (order to login pe hi hota hai, par cart guest me bhi
   lean rehna chahiye). Rate-limit + image-only guard abuse rokte hain. */
router.post(
  '/custom-image',
  optionalAuth,
  customUploadLimiter,
  upload.single('image'),
  controller.uploadCustomImage
);

export default router;
