import { Router } from 'express';
import { requireAdmin } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import { uploadAny } from '@/middlewares/upload.middleware';
import * as controller from './products.controller';
import {
  adminListQuerySchema,
  byCategoryQuerySchema,
  imageDeleteSchema,
  newArrivalsQuerySchema,
  offersQuerySchema,
  patchStatusSchema,
  relatedQuerySchema,
  storefrontCategoryQuerySchema,
  storefrontListQuerySchema,
  storefrontSubCategoryQuerySchema,
  suggestQuerySchema,
} from './products.validation';

const router = Router();

/* ─── Storefront (public) ───────────────────────────────────── */

// Original: GET /api/v1/products/top-related-products
router.get(
  '/storefront/related',
  validate(relatedQuerySchema, 'query'),
  controller.topRelated
);
// Original: GET /api/v1/products/search-suggestions
router.get(
  '/storefront/suggest',
  validate(suggestQuerySchema, 'query'),
  controller.suggest
);
// Original: GET /api/v1/products/new-arrivals
router.get(
  '/storefront/new',
  validate(newArrivalsQuerySchema, 'query'),
  controller.newArrivals
);
// Original: GET /api/v1/products/offers
router.get(
  '/storefront/offers',
  validate(offersQuerySchema, 'query'),
  controller.withOffers
);
// Original: GET /api/v1/products/category
router.get(
  '/storefront/categories',
  validate(storefrontCategoryQuerySchema, 'query'),
  controller.storefrontByCategory
);
// Original: GET /api/v1/products/sub-category
router.get(
  '/storefront/subcategories',
  validate(storefrontSubCategoryQuerySchema, 'query'),
  controller.storefrontBySubCategory
);

// Original: GET /api/v1/products  (filter + sort + paginate)
router.get(
  '/storefront',
  validate(storefrontListQuerySchema, 'query'),
  controller.storefrontList
);
// Original: GET /api/v1/products/[slug]
router.get('/storefront/:slug', controller.storefrontBySlug);

// Original: GET /api/v1/products/[id]
router.get('/storefront/byId/:id', controller.storefrontById);


/* ─── Admin: misc reads BEFORE /:id route to avoid shadowing ── */
// Original: GET /api/product/by_category
router.get(
  '/by-category',
  ...requireAdmin,
  validate(byCategoryQuerySchema, 'query'),
  controller.byCategory
);
// Original: POST /api/product/image-delate
router.post(
  '/image-delete',
  ...requireAdmin,
  validate(imageDeleteSchema),
  controller.deleteSingleImage
);
// Original: POST /api/product/[id]/copy
router.post('/:id/copy', ...requireAdmin, controller.copyProduct);

/* ─── Admin: CRUD ───────────────────────────────────────────── */
// Original: GET /api/product
router.get(
  '/',
  ...requireAdmin,
  validate(adminListQuerySchema, 'query'),
  controller.adminList
);
// Original: POST /api/product  (multipart)
router.post('/', ...requireAdmin, uploadAny, controller.createProduct);
// Original: GET /api/product/[id]
router.get('/:id', ...requireAdmin, controller.byIdAdmin);
// Original: PUT /api/product/[id]  (multipart)
router.put('/:id', ...requireAdmin, uploadAny, controller.updateProduct);
// Original: PATCH /api/product/[id]
router.patch(
  '/:id',
  ...requireAdmin,
  validate(patchStatusSchema),
  controller.patchStatus
);
// Original: DELETE /api/product/[id]
router.delete('/:id', ...requireAdmin, controller.deleteProduct);

export default router;
