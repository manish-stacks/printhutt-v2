"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepo = void 0;
const userModel_1 = __importDefault(require("@/db/models/userModel"));
/**
 * Auth repository. Thin wrapper around the User model.
 * All Mongoose calls live here so the service stays mongoose-free.
 */
exports.authRepo = {
    findByEmail: (email) => userModel_1.default.findOne({ email }),
    findByNumber: (number) => userModel_1.default.findOne({ number }),
    findByEmailOrNumber: (key, value) => userModel_1.default.findOne({ [key]: value }),
    findById: (id) => userModel_1.default.findById(id),
    findByVerifyToken: (token) => userModel_1.default.findOne({
        verifyToken: token,
        verifyTokenExpiry: { $gt: Date.now() },
    }),
    create: (data) => userModel_1.default.create(data),
};
//# sourceMappingURL=auth.repository.js.map