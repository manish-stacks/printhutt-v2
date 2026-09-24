import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { upload } from '@/middlewares/upload.middleware';
import * as controller from './sliders.controller';
import { listSlidersQuerySchema } from './sliders.validation';

const router = Router();

/* Original: GET /api/v1/slider — storefront active sliders */
router.get('/storefront', controller.storefrontActive);

/* Original: GET /api/slider */
router.get(
  '/',
  ...requireAdmin,
  validate(listSlidersQuerySchema, 'query'),
  controller.adminList
);
/* Original: POST /api/slider  (multipart field 'slider') */
router.post(
  '/',
  ...requireAdmin,
  upload.single('slider'),
  controller.createSlider
);
/* Original: PUT /api/slider/[id]  (multipart) */
router.put(
  '/:id',
  ...requireAdmin,
  upload.single('slider'),
  controller.updateSlider
);
/* Original: DELETE /api/slider/[id] */
router.delete('/:id', ...requireAdmin, controller.deleteSlider);

export default router;
