import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import multer from 'multer';
import * as controller from './personalized-gifts.controller';
import { listQuerySchema } from './personalized-gifts.validation';

// Image + local video uploads (images only, 10 MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.get('/storefront', validate(listQuerySchema, 'query'), controller.storefrontList);
router.post('/', ...requireAdmin, upload.single('media'), controller.createGift);
router.put('/:id', ...requireAdmin, upload.single('media'), controller.updateGift);
router.delete('/:id', ...requireAdmin, controller.deleteGift);
export default router;
