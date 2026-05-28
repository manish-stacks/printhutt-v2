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
exports.storefrontActive = exports.deleteSlider = exports.updateSlider = exports.createSlider = exports.adminList = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const service = __importStar(require("./sliders.service"));
const pickFile = (req, field) => {
    const single = req.file;
    if (single && single.fieldname === field)
        return single;
    const many = req.files ?? [];
    return many.find((f) => f.fieldname === field);
};
/* GET /api/sliders  (admin) */
exports.adminList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.adminList(req.query);
    return res.json(result);
});
/* POST /api/sliders  (multipart, field name 'slider') */
exports.createSlider = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const file = pickFile(req, 'slider');
    const body = req.body;
    const slider = await service.createSlider({
        title: body.title,
        link: body.link,
        isActive: body.isActive,
        level: body.level,
    }, file);
    return (0, api_response_1.sendCreated)(res, { message: 'Slider created successfully', data: slider });
});
/* PUT /api/sliders/:id  (multipart) */
exports.updateSlider = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const file = pickFile(req, 'slider');
    const body = req.body;
    await service.updateSlider((0, req_1.param)(req, 'id'), {
        title: body.title,
        link: body.link,
        isActive: body.isActive,
        level: body.level,
    }, file);
    return (0, api_response_1.sendOk)(res, { message: 'Slider updated successfully' });
});
/* DELETE /api/sliders/:id */
exports.deleteSlider = (0, async_handler_1.asyncHandler)(async (req, res) => {
    await service.deleteSlider((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { message: 'Slider deleted successfully' });
});
/* GET /api/sliders/storefront  (active only) */
exports.storefrontActive = (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const result = await service.storefrontActive();
    return res.json(result);
});
//# sourceMappingURL=sliders.controller.js.map