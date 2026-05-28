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
const controller = __importStar(require("./subcategories.controller"));
const subcategories_validation_1 = require("./subcategories.validation");
const router = (0, express_1.Router)();
/* ─── Public ────────────────────────────────────────────────── */
// Original: POST /api/sub-category/fetch-category  { id: parentId }
router.post('/fetch', (0, validate_middleware_1.validate)(subcategories_validation_1.fetchByParentSchema), controller.fetchByParent);
// Storefront slug lookup (called by /v1/categories/[slug]?type=subcategory)
router.get('/slug/:slug', controller.bySlug);
/* ─── Admin ─────────────────────────────────────────────────── */
// Original: GET /api/sub-category
router.get('/', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(subcategories_validation_1.listSubcategoriesQuerySchema, 'query'), controller.adminList);
// Original: POST /api/sub-category  (multipart)
router.post('/', ...auth_middleware_1.requireAdmin, upload_middleware_1.upload.single('imageUrl'), controller.createSubcategory);
// Original: GET /api/sub-category/[id]
router.get('/:id', ...auth_middleware_1.requireAdmin, controller.byId);
// Original: PUT /api/sub-category/[id]  (multipart)
router.put('/:id', ...auth_middleware_1.requireAdmin, upload_middleware_1.upload.single('imageUrl'), controller.updateSubcategory);
// Original: DELETE /api/sub-category/[id]
router.delete('/:id', ...auth_middleware_1.requireAdmin, controller.deleteSubcategory);
// Original: PATCH /api/sub-category/[id]  { status: boolean }
router.patch('/:id', ...auth_middleware_1.requireAdmin, (0, validate_middleware_1.validate)(subcategories_validation_1.patchSubcategorySchema), controller.patchSubcategory);
exports.default = router;
//# sourceMappingURL=subcategories.routes.js.map