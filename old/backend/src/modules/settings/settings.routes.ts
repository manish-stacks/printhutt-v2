import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { upload } from '@/middlewares/upload.middleware';
import * as controller from './settings.controller';
import { bulkUpsertSchema, singleUpsertSchema } from './settings.validation';

const router = Router();

// Public
router.get('/', controller.publicMap);

// Admin
router.get('/admin', ...requireAdmin, controller.adminAll);
router.post('/bulk', ...requireAdmin, validate(bulkUpsertSchema), controller.bulkUpsert);
router.post('/upload', ...requireAdmin, upload.single('image'), controller.uploadImageSetting);
router.get('/:key', controller.byKey); // public single read
router.put('/:key', ...requireAdmin, validate(singleUpsertSchema), controller.singleUpsert);
router.delete('/:key', ...requireAdmin, controller.remove);

export default router;