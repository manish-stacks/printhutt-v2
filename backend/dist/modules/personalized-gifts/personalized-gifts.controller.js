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
exports.deleteGift = exports.updateGift = exports.createGift = exports.storefrontList = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const service = __importStar(require("./personalized-gifts.service"));
const pickFile = (req, field) => {
    const single = req.file;
    if (single && single.fieldname === field)
        return single;
    const many = req.files ?? [];
    return many.find((f) => f.fieldname === field);
};
exports.storefrontList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const q = req.query;
    const data = await service.storefrontList(q.sectionType);
    return (0, api_response_1.sendOk)(res, { data });
});
exports.createGift = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.createGift(req.body, pickFile(req, 'media'));
    return (0, api_response_1.sendOk)(res, { message: 'Created Successfully', data });
});
exports.updateGift = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.updateGift((0, req_1.param)(req, 'id'), req.body, pickFile(req, 'media'));
    return (0, api_response_1.sendOk)(res, { message: 'Updated Successfully', data });
});
exports.deleteGift = (0, async_handler_1.asyncHandler)(async (req, res) => {
    await service.deleteGift((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { message: 'Deleted Successfully' });
});
//# sourceMappingURL=personalized-gifts.controller.js.map