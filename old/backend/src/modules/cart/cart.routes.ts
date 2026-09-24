import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './cart.controller';
import {
  addToSessionCartSchema,
  bulkDeleteSchema,
  listCartQuerySchema,
} from './cart.validation';

const router = Router();

/* Public: POST /api/cart (add-to-cart analytics) */
router.post('/', validate(addToSessionCartSchema), controller.addToSessionCart);

/* Admin: bulk delete — :id jaisa kuch nahi, but rakho POST se pehle clean */
router.post('/bulk-delete', ...requireAdmin, validate(bulkDeleteSchema), controller.bulkDelete);

/* Admin: GET /api/cart (paginated) */
router.get('/', ...requireAdmin, validate(listCartQuerySchema, 'query'), controller.listCart);

export default router;