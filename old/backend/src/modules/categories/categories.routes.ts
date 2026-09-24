import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { upload } from '@/middlewares/upload.middleware';
import * as controller from './categories.controller';
import {
  listCategoriesQuerySchema,
  patchCategorySchema,
  storefrontListQuerySchema,
  subListQuerySchema,
  slugTypeQuerySchema,
} from './categories.validation';

const router = Router();

/* ─── Storefront (public) ───────────────────────────────────── */
// Original: GET /api/v1/categories
router.get(
  '/storefront',
  validate(storefrontListQuerySchema, 'query'),
  controller.storefrontList
);
// Original: GET /api/v1/categories/featured-categories
router.get('/featured', controller.featured);
// Original: GET /api/v1/categories/sub-categories?category=&limit=
router.get('/with-sub', validate(subListQuerySchema, 'query'), controller.withSub);
// Original: GET /api/v1/categories/[slug]?type=category|subcategory
router.get('/slug/:slug', validate(slugTypeQuerySchema, 'query'), controller.bySlug);
// Original: GET /api/category/fetch-category (id + name only, for dropdowns)
router.get('/fetch', controller.fetchOptions);

/* ─── Admin ─────────────────────────────────────────────────── */
// Original: GET /api/category
router.get(
  '/',
  ...requireAdmin,
  validate(listCategoriesQuerySchema, 'query'),
  controller.adminList
);
// Original: POST /api/category  (multipart with imageUrl)
router.post(
  '/',
  ...requireAdmin,
  upload.single('imageUrl'),
  controller.createCategory
);
// Original: GET /api/category/[id]
router.get('/:id', ...requireAdmin, controller.byId);
// Original: PUT /api/category/[id]  (multipart with imageUrl)
router.put(
  '/:id',
  ...requireAdmin,
  upload.single('imageUrl'),
  controller.updateCategory
);
// Original: DELETE /api/category/[id]
router.delete('/:id', ...requireAdmin, controller.deleteCategory);
// Original: PATCH /api/category/[id]  (toggle status / field)
router.patch(
  '/:id',
  ...requireAdmin,
  validate(patchCategorySchema),
  controller.patchCategory
);

export default router;
