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
exports.bySlug = exports.withSub = exports.featured = exports.storefrontList = exports.fetchOptions = exports.patchCategory = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.byId = exports.adminList = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const service = __importStar(require("./categories.service"));
const pickFile = (req, field = 'imageUrl') => {
    // upload.single sets req.file
    const single = req.file;
    if (single && single.fieldname === field)
        return single;
    // upload.any / upload.fields populates req.files
    const many = req.files ?? [];
    return many.find((f) => f.fieldname === field);
};
/* ─── Admin ──────────────────────────────────────────────────── */
exports.adminList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.adminList(req.query);
    return res.json(result);
});
exports.byId = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const category = await service.byId((0, req_1.param)(req, 'id'));
    return res.json(category);
});
exports.createCategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const file = pickFile(req);
    const body = req.body;
    const result = await service.createCategory({
        name: body.name?.trim?.() ?? '',
        slug: body.slug?.trim?.() ?? '',
        description: body.description,
        metaKeywords: body.metaKeywords,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        level: body.level,
        status: body.status,
    }, file);
    return (0, api_response_1.sendCreated)(res, result);
});
exports.updateCategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const file = pickFile(req);
    const body = req.body;
    const result = await service.updateCategory((0, req_1.param)(req, 'id'), {
        name: body.name,
        slug: body.slug,
        description: body.description,
        metaKeywords: body.metaKeywords,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        level: body.level,
        status: body.status,
    }, file);
    return (0, api_response_1.sendOk)(res, result);
});
exports.deleteCategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.deleteCategory((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, result);
});
exports.patchCategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.patchCategory((0, req_1.param)(req, 'id'), req.body);
    return (0, api_response_1.sendOk)(res, result);
});
exports.fetchOptions = (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const result = await service.fetchOptions();
    return (0, api_response_1.sendOk)(res, result);
});
/* ─── Storefront ─────────────────────────────────────────────── */
exports.storefrontList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const q = req.query;
    const result = await service.storefrontList(q.limit);
    return res.json(result);
});
exports.featured = (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const result = await service.featured();
    return res.json(result);
});
exports.withSub = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const q = req.query;
    const result = await service.withSub(q.category, q.limit);
    return res.json(result);
});
exports.bySlug = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const q = req.query;
    const result = await service.bySlug((0, req_1.param)(req, 'slug'), q.type);
    return res.json(result);
});
//# sourceMappingURL=categories.controller.js.map