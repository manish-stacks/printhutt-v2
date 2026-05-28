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
exports.storefrontRecent = exports.deleteTestimonial = exports.updateTestimonial = exports.createTestimonial = exports.adminList = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const service = __importStar(require("./testimonials.service"));
const pickFile = (req, field) => {
    const single = req.file;
    if (single && single.fieldname === field)
        return single;
    const many = req.files ?? [];
    return many.find((f) => f.fieldname === field);
};
exports.adminList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.adminList(req.query);
    return res.json(result);
});
exports.createTestimonial = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const file = pickFile(req, 'image');
    const body = req.body;
    const data = await service.createTestimonial({ name: body.name, feedback: body.feedback, isActive: body.isActive }, file);
    return (0, api_response_1.sendCreated)(res, { message: 'Testimonial created successfully', data });
});
exports.updateTestimonial = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const file = pickFile(req, 'image');
    const body = req.body;
    await service.updateTestimonial((0, req_1.param)(req, 'id'), { name: body.name, feedback: body.feedback, isActive: body.isActive }, file);
    return (0, api_response_1.sendOk)(res, { message: 'Testimonial updated successfully' });
});
exports.deleteTestimonial = (0, async_handler_1.asyncHandler)(async (req, res) => {
    await service.deleteTestimonial((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { message: 'Testimonial deleted successfully' });
});
exports.storefrontRecent = (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const result = await service.storefrontRecent();
    return res.json(result);
});
//# sourceMappingURL=testimonials.controller.js.map