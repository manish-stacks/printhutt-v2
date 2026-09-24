import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { upload } from '@/middlewares/upload.middleware';
import * as controller from './testimonials.controller';
import { listTestimonialsQuerySchema } from './testimonials.validation';

const router = Router();

/* Original: GET /api/v1/testimonial — storefront */
router.get('/storefront', controller.storefrontRecent);

/* Original: GET /api/testimonial */
router.get(
  '/',
  ...requireAdmin,
  validate(listTestimonialsQuerySchema, 'query'),
  controller.adminList
);
/* Original: POST /api/testimonial  (multipart, field name 'image') */
router.post(
  '/',
  ...requireAdmin,
  upload.single('image'),
  controller.createTestimonial
);
/* Original: PUT /api/testimonial/[id]  (multipart) */
router.put(
  '/:id',
  ...requireAdmin,
  upload.single('image'),
  controller.updateTestimonial
);
/* Original: DELETE /api/testimonial/[id] */
router.delete('/:id', ...requireAdmin, controller.deleteTestimonial);

export default router;
