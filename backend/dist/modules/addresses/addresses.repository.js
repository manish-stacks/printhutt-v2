"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressesRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const addressModel_1 = require("@/db/models/addressModel");
const userModel_1 = __importDefault(require("@/db/models/userModel"));
exports.addressesRepo = {
    findByUser: (userId) => addressModel_1.Address.find({ userId }),
    findById: (id) => addressModel_1.Address.findById(id),
    countByUser: (userId) => addressModel_1.Address.countDocuments({ userId }),
    clearDefaultForUser: (userId) => addressModel_1.Address.updateMany({ userId }, { isDefault: false }),
    create: (data) => addressModel_1.Address.create(data),
    updateById: (id, patch) => addressModel_1.Address.findByIdAndUpdate(id, { $set: patch }, { new: true }),
    deleteById: (id) => addressModel_1.Address.findByIdAndDelete(id),
    findUserById: (id) => userModel_1.default.findById(id),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=addresses.repository.js.map