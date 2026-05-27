import { Router } from 'express';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './cart.controller';
import { addToSessionCartSchema } from './cart.validation';

const router = Router();

/* Original: POST /api/session-cart */
router.post('/', validate(addToSessionCartSchema), controller.addToSessionCart);
/* Original: GET /api/session-cart */
router.get('/', controller.recentSessionCart);

export default router;
