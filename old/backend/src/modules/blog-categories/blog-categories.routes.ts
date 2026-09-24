import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { upload } from '@/middlewares/upload.middleware';
import * as controller from './blog-categories.controller';
import { listQuerySchema } from './blog-categories.validation';

const router = Router();
router.get('/', ...requireAdmin, validate(listQuerySchema, 'query'), controller.adminList);
// Original accepts multipart even though no file; use upload.none for safety
router.post('/', ...requireAdmin, upload.none(), controller.createBlogCategory);
router.put('/:id', ...requireAdmin, upload.none(), controller.updateBlogCategory);
router.delete('/:id', ...requireAdmin, controller.deleteBlogCategory);
export default router;
