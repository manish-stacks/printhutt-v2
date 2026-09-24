import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './offers.controller';
import {
  createOfferSchema,
  listOffersQuerySchema,
  updateOfferSchema,
} from './offers.validation';

const router = Router();

/* Original: GET /api/offer/get-all  (id + title for dropdowns) */
router.get('/all', controller.fetchOptions);

/* Original: GET /api/offer  (admin paginated) */
router.get(
  '/',
  ...requireAdmin,
  validate(listOffersQuerySchema, 'query'),
  controller.adminList
);
/* Original: POST /api/offer */
router.post('/', ...requireAdmin, validate(createOfferSchema), controller.createOffer);
/* Original: GET /api/offer/[id] */
router.get('/:id', ...requireAdmin, controller.byId);
/* Original: PUT /api/offer/[id] */
router.put(
  '/:id',
  ...requireAdmin,
  validate(updateOfferSchema),
  controller.updateOffer
);
/* Original: DELETE /api/offer/[id] */
router.delete('/:id', ...requireAdmin, controller.deleteOffer);

export default router;
