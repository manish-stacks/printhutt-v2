"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("@/middlewares/auth.middleware");
const validate_middleware_1 = require("@/middlewares/validate.middleware");
const upload_middleware_1 = require("@/middlewares/upload.middleware");
const controller = __importStar(require("./products.controller"));
const products_validation_1 = require("./products.validation");
const router = (0, express_1.Router)();
/* ─── Storefront (public) ───────────────────────────────────── */
// Original: GET /api/v1/products/top-related-products
router.get('/storefront/related', (0, validate_middleware_1.validate)(products_validation_1.relatedQuerySchema, 'query'), controller.topRelated);
// Original: GET /api/v1/products/search-suggestions
router.get('/storefront/suggest', (0, validate_middleware_1.validate)(products_validation_1.suggestQuerySchema, 'query'), controller.suggest);
// Original: GET /api/v1/products/new-arrivals
router.get('/storefront/new', (0, validate_middleware_1.validate)(products_validation_1.newArrivalsQuerySchema, 'query'), controller.newArrivals);
// Original: GET /api/v1/products/offers
router.get('/storefront/offers', (0, validate_middleware_1.validate)(products_validation_1.offersQuerySchema, 'query'), controller.withOffers);
// Original: GET /api/v1/products/category
router.get('/storefront/categories', (0, validate_middleware_1.validate)(products_validation_1.storefrontCategoryQuerySchema, 'query'), controller.storefrontByCategory);
// Original: GET /api/v1/products/sub-category
router.get('/storefront/subcategories', (0, validate_middleware_1.validate)(products_validation_1.storefrontSubCategoryQuerySchema, 'query'), controller.storefrontBySubCategory);
// Original: GET /api/v1/products  (filter + sort + paginate)
router.get('/storefront', (0, validate_middleware_1.validate)(products_validation_1.storefrontListQuerySchema, 'query'), controller.storefrontList);
// Original: GET /api/v1/products/[slug]
router.get('/storefront/:slug', controller.storefrontBySlug);
// Original: GET /api/v1/products/[id]
router.get('/storefront/byId/:id', controller.storefrontById);
/* ─── Admin: misc reads BEFORE /:id route to avoid shadowing ── */
// Original: GET /api/product/by_category
router.get('/by-category', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(products_validation_1.byCategoryQuerySchema, 'query'), controller.byCategory);
// Original: POST /api/product/image-delate
router.post('/image-delete', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(products_validation_1.imageDeleteSchema), controller.deleteSingleImage);
// Original: POST /api/product/[id]/copy
router.post('/:id/copy', ...auth_middleware_1.requireAdmin, controller.copyProduct);
/* ─── Admin: CRUD ───────────────────────────────────────────── */
// Original: GET /api/product
router.get('/', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(products_validation_1.adminListQuerySchema, 'query'), controller.adminList);
// Original: POST /api/product  (multipart)
router.post('/', ...auth_middleware_1.requireAdmin, upload_middleware_1.uploadAny, controller.createProduct);
// Original: GET /api/product/[id]
router.get('/:id', ...auth_middleware_1.requireAdmin, controller.byIdAdmin);
// Original: PUT /api/product/[id]  (multipart)
router.put('/:id', ...auth_middleware_1.requireAdmin, upload_middleware_1.uploadAny, controller.updateProduct);
// Original: PATCH /api/product/[id]
router.patch('/:id', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(products_validation_1.patchStatusSchema), controller.patchStatus);
// Original: DELETE /api/product/[id]
router.delete('/:id', ...auth_middleware_1.requireAdmin, controller.deleteProduct);
exports.default = router;
//# sourceMappingURL=products.routes.js.map