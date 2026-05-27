import { Router } from 'express';
import { optionalAuth, requireAuth } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import * as controller from './wishlist.controller';
import { addToWishlistSchema } from './wishlist.validation';

const router = Router();

/* Original: POST /api/v1/wishlist  (auth required) */
router.post('/', requireAuth, validate(addToWishlistSchema), controller.addToWishlist);
/* Original: GET /api/v1/wishlist  (optional auth — anonymous gets empty list) */
router.get('/', optionalAuth, controller.getWishlist);
/* Original: DELETE /api/v1/wishlist/[id] */
router.delete('/:id', requireAuth, controller.removeFromWishlist);

export default router;
