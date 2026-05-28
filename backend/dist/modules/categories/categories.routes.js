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
const controller = __importStar(require("./categories.controller"));
const categories_validation_1 = require("./categories.validation");
const router = (0, express_1.Router)();
/* ─── Storefront (public) ───────────────────────────────────── */
// Original: GET /api/v1/categories
router.get('/storefront', (0, validate_middleware_1.validate)(categories_validation_1.storefrontListQuerySchema, 'query'), controller.storefrontList);
// Original: GET /api/v1/categories/featured-categories
router.get('/featured', controller.featured);
// Original: GET /api/v1/categories/sub-categories?category=&limit=
router.get('/with-sub', (0, validate_middleware_1.validate)(categories_validation_1.subListQuerySchema, 'query'), controller.withSub);
// Original: GET /api/v1/categories/[slug]?type=category|subcategory
router.get('/slug/:slug', (0, validate_middleware_1.validate)(categories_validation_1.slugTypeQuerySchema, 'query'), controller.bySlug);
// Original: GET /api/category/fetch-category (id + name only, for dropdowns)
router.get('/fetch', controller.fetchOptions);
/* ─── Admin ─────────────────────────────────────────────────── */
// Original: GET /api/category
router.get('/', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(categories_validation_1.listCategoriesQuerySchema, 'query'), controller.adminList);
// Original: POST /api/category  (multipart with imageUrl)
router.post('/', ...auth_middleware_1.requireAdmin, upload_middleware_1.upload.single('imageUrl'), controller.createCategory);
// Original: GET /api/category/[id]
router.get('/:id', ...auth_middleware_1.requireAdmin, controller.byId);
// Original: PUT /api/category/[id]  (multipart with imageUrl)
router.put('/:id', ...auth_middleware_1.requireAdmin, upload_middleware_1.upload.single('imageUrl'), controller.updateCategory);
// Original: DELETE /api/category/[id]
router.delete('/:id', ...auth_middleware_1.requireAdmin, controller.deleteCategory);
// Original: PATCH /api/category/[id]  (toggle status / field)
router.patch('/:id', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(categories_validation_1.patchCategorySchema), controller.patchCategory);
exports.default = router;
//# sourceMappingURL=categories.routes.js.map