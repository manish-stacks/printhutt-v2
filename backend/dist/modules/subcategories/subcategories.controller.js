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
exports.bySlug = exports.fetchByParent = exports.patchSubcategory = exports.deleteSubcategory = exports.updateSubcategory = exports.createSubcategory = exports.byId = exports.adminList = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const service = __importStar(require("./subcategories.service"));
const pickFile = (req, field = 'imageUrl') => {
    const single = req.file;
    if (single && single.fieldname === field)
        return single;
    const many = req.files ?? [];
    return many.find((f) => f.fieldname === field);
};
/* ─── Admin ─────────────────────────────────────────────────── */
exports.adminList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.adminList(req.query);
    return res.json(result);
});
exports.byId = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.byId((0, req_1.param)(req, 'id'));
    return res.json(result);
});
exports.createSubcategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const file = pickFile(req);
    const body = req.body;
    const result = await service.createSubcategory({
        name: body.name,
        slug: body.slug,
        description: body.description,
        metaKeywords: body.metaKeywords,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        parentCategory: body.parentCategory || undefined,
        level: body.level,
        status: body.status === 'true',
    }, file);
    return (0, api_response_1.sendCreated)(res, result);
});
exports.updateSubcategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const file = pickFile(req);
    const body = req.body;
    const result = await service.updateSubcategory((0, req_1.param)(req, 'id'), {
        name: body.name,
        slug: body.slug,
        description: body.description,
        metaKeywords: body.metaKeywords,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        parentCategory: body.parentCategory,
        level: body.level,
        status: body.status === undefined ? undefined : body.status === 'true',
    }, file);
    return (0, api_response_1.sendOk)(res, result);
});
exports.deleteSubcategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.deleteSubcategory((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, result);
});
exports.patchSubcategory = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.patchSubcategory((0, req_1.param)(req, 'id'), req.body);
    return (0, api_response_1.sendOk)(res, result);
});
/* ─── Public ────────────────────────────────────────────────── */
exports.fetchByParent = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.fetchByParent(req.body.id);
    return res.json(result);
});
exports.bySlug = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.bySlug((0, req_1.param)(req, 'slug'));
    return res.json(result);
});
//# sourceMappingURL=subcategories.controller.js.map