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
exports.fetchOptions = exports.deleteOffer = exports.updateOffer = exports.createOffer = exports.byId = exports.adminList = void 0;
const req_1 = require("@/utils/req");
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const service = __importStar(require("./offers.service"));
exports.adminList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.adminList(req.query);
    return (0, api_response_1.sendOk)(res, result);
});
exports.byId = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const offer = await service.byId((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { data: offer });
});
exports.createOffer = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.createOffer(req.body);
    return (0, api_response_1.sendCreated)(res, { message: 'Data inserted successfully', data });
});
exports.updateOffer = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const data = await service.updateOffer((0, req_1.param)(req, 'id'), req.body);
    return (0, api_response_1.sendOk)(res, { message: 'Offer updated successfully', data });
});
exports.deleteOffer = (0, async_handler_1.asyncHandler)(async (req, res) => {
    await service.deleteOffer((0, req_1.param)(req, 'id'));
    return (0, api_response_1.sendOk)(res, { message: 'Offer deleted successfully' });
});
exports.fetchOptions = (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const data = await service.fetchOptions();
    return (0, api_response_1.sendOk)(res, { message: 'Data fetched successfully', data });
});
//# sourceMappingURL=offers.controller.js.map