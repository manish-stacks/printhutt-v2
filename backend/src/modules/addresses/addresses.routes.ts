import { Router } from 'express';
import { requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './addresses.controller';
import {
  addressSchema,
  addressUpdateSchema,
} from './addresses.validation';

const router = Router();

/* Original: GET /api/address */
router.get('/', requireAuth, controller.listMyAddresses);
/* Original: POST /api/address */
router.post('/', requireAuth, validate(addressSchema), controller.createAddress);
/* Original: PUT /api/address/[id] */
router.put(
  '/:id',
  requireAuth,
  validate(addressUpdateSchema),
  controller.updateAddress
);
/* Original: DELETE /api/address/[id] */
router.delete('/:id', requireAuth, controller.deleteAddress);

export default router;
