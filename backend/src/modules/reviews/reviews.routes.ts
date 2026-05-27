import { Router } from 'express';
import { requireAdmin, requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { uploadAny } from '@/middlewares/upload.middleware';
import * as controller from './reviews.controller';
import { listReviewsQuerySchema } from './reviews.validation';

const router = Router();

/* Original: POST /api/reviews   (logged-in user) */
router.post('/', requireAuth, uploadAny, controller.createReview);

/* Original: GET /api/reviews    (admin paginated list) */
router.get(
  '/',
  ...requireAdmin,
  validate(listReviewsQuerySchema, 'query'),
  controller.adminList
);

/* Original: DELETE /api/reviews/[id]   (admin only) */
router.delete('/:id', ...requireAdmin, controller.deleteReview);

export default router;
