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
exports.topRelated = exports.suggest = exports.withOffers = exports.newArrivals = exports.storefrontBySubCategory = exports.storefrontByCategory = exports.storefrontBySlug = exports.storefrontById = exports.storefrontList = exports.deleteSingleImage = exports.byCategory = exports.copyProduct = exports.patchStatus = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.byIdAdmin = exports.adminList = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const service = __importStar(require("./products.service"));
/* Splits req.files (upload.any) into thumbnail / images / variant-keyed map */
const splitFiles = (req) => {
    const files = req.files ?? [];
    const thumbnail = files.find((f) => f.fieldname === 'thumbnail');
    const galleryImages = files.filter((f) => f.fieldname === 'images');
    const variantFiles = {};
    for (const f of files) {
        if (f.fieldname.startsWith('variant_thumbnail_') ||
            f.fieldname.startsWith('variant_image_')) {
            variantFiles[f.fieldname] = f;
        }
    }
    return { thumbnail, galleryImages, variantFiles };
};
/* ─── Admin ─────────────────────────────────────────────────── */
exports.adminList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.adminList(req.query);
    return res.json(result);
});
exports.byIdAdmin = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const product = await service.byId((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { data: product });
});
exports.createProduct = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { thumbnail, galleryImages, variantFiles } = splitFiles(req);
    const result = await service.createProduct(req.body, thumbnail, galleryImages, variantFiles);
    return (0, api_response_1.sendCreated)(res, result);
});
exports.updateProduct = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { thumbnail, galleryImages, variantFiles } = splitFiles(req);
    const result = await service.updateProduct((0, req_1.param)(req, 'id'), req.body, thumbnail, galleryImages, variantFiles);
    return (0, api_response_1.sendOk)(res, result);
});
exports.deleteProduct = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.deleteProduct((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, result);
});
exports.patchStatus = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.patchStatus((0, req_1.param)(req, 'id'), req.body.status);
    return (0, api_response_1.sendOk)(res, result);
});
exports.copyProduct = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.copyProduct((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendCreated)(res, result);
});
exports.byCategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.byCategory(req.query);
    return res.json(result);
});
exports.deleteSingleImage = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.deleteSingleImage(req.body);
    return (0, api_response_1.sendOk)(res, result);
});
/* ─── Storefront ────────────────────────────────────────────── */
exports.storefrontList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.storefrontList(req.query);
    return res.json(result);
});
exports.storefrontById = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const product = await service.byIdStorefront((0, req_1.param)(req, 'id'));
    return res.json(product);
});
exports.storefrontBySlug = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const product = await service.bySlugStorefront((0, req_1.param)(req, 'slug'));
    return res.json(product);
});
exports.storefrontByCategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.storefrontByCategorySlug(req.query);
    return res.json(result);
});
exports.storefrontBySubCategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.storefrontBySubCategorySlug(req.query);
    return res.json(result);
});
exports.newArrivals = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.newArrivals(req.query);
    return res.json(result);
});
exports.withOffers = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.withOffers(req.query);
    return res.json(result);
});
exports.suggest = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.suggest(req.query);
    return res.json(result);
});
exports.topRelated = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.topRelated(req.query);
    return res.json(result);
});
//# sourceMappingURL=products.controller.js.map