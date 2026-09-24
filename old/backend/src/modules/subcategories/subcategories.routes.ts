import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { upload } from '@/middlewares/upload.middleware';
import * as controller from './subcategories.controller';
import {
  fetchByParentSchema,
  listSubcategoriesQuerySchema,
  patchSubcategorySchema,
} from './subcategories.validation';

const router = Router();

/* ─── Public ────────────────────────────────────────────────── */
// Original: POST /api/sub-category/fetch-category  { id: parentId }
router.post('/fetch', validate(fetchByParentSchema), controller.fetchByParent);
// Storefront slug lookup (called by /v1/categories/[slug]?type=subcategory)
router.get('/slug/:slug', controller.bySlug);

/* ─── Admin ─────────────────────────────────────────────────── */
// Original: GET /api/sub-category
router.get(
  '/',
  ...requireAdmin,
  validate(listSubcategoriesQuerySchema, 'query'),
  controller.adminList
);
// Original: POST /api/sub-category  (multipart)
router.post(
  '/',
  ...requireAdmin,
  upload.single('imageUrl'),
  controller.createSubcategory
);
// Original: GET /api/sub-category/[id]
router.get('/:id', ...requireAdmin, controller.byId);
// Original: PUT /api/sub-category/[id]  (multipart)
router.put(
  '/:id',
  ...requireAdmin,
  upload.single('imageUrl'),
  controller.updateSubcategory
);
// Original: DELETE /api/sub-category/[id]
router.delete('/:id', ...requireAdmin, controller.deleteSubcategory);
// Original: PATCH /api/sub-category/[id]  { status: boolean }
router.patch(
  '/:id',
  ...requireAdmin,
  validate(patchSubcategorySchema),
  controller.patchSubcategory
);

export default router;
