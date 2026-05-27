import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { upload } from '@/middlewares/upload.middleware';
import * as controller from './personalized-gifts.controller';
import { listQuerySchema } from './personalized-gifts.validation';

const router = Router();
router.get('/storefront', validate(listQuerySchema, 'query'), controller.storefrontList);
router.post('/', ...requireAdmin, upload.single('media'), controller.createGift);
router.put('/:id', ...requireAdmin, upload.single('media'), controller.updateGift);
router.delete('/:id', ...requireAdmin, controller.deleteGift);
export default router;
