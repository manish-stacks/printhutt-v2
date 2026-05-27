import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { upload } from '@/middlewares/upload.middleware';
import * as controller from './blogs.controller';
import { listBlogsQuerySchema, patchBlogSchema } from './blogs.validation';

const router = Router();

// Storefront
router.get('/storefront', controller.storefrontList);
router.get('/slug/:slug', controller.bySlug);

// Admin
router.get('/', ...requireAdmin, validate(listBlogsQuerySchema, 'query'), controller.adminList);
router.post('/', ...requireAdmin, upload.single('imageUrl'), controller.createBlog);
router.get('/:id', ...requireAdmin, controller.byId);
router.put('/:id', ...requireAdmin, upload.single('imageUrl'), controller.updateBlog);
router.delete('/:id', ...requireAdmin, controller.deleteBlog);
router.patch('/:id', ...requireAdmin, validate(patchBlogSchema), controller.patchBlog);

export default router;
