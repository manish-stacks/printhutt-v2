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
exports.updateProfile = exports.userDashboard = exports.adminList = void 0;
const async_handler_1 = require("@/utils/async-handler");
const api_response_1 = require("@/utils/api-response");
const errors_1 = require("@/utils/errors");
const service = __importStar(require("./users.service"));
/* GET /api/users — admin list */
exports.adminList = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await service.adminList(req.query);
    // Original response did NOT wrap in { success, data } — preserve shape.
    return res.json(result);
});
/* GET /api/users/me — user dashboard counts */
exports.userDashboard = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    const data = await service.userDashboard(req.user.id);
    return (0, api_response_1.sendOk)(res, { data });
});
/* POST /api/users/me/profile — update profile */
exports.updateProfile = (0, async_handler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw new errors_1.UnauthorizedError();
    const user = await service.updateProfile(req.user.id, req.body);
    return (0, api_response_1.sendOk)(res, { message: 'User updated successfully', user });
});
//# sourceMappingURL=users.controller.js.map