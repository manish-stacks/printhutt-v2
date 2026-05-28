"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnPolicyRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const returnPolicyModule_1 = __importDefault(require("@/db/models/returnPolicyModule"));
exports.returnPolicyRepo = {
    adminList: async (page, limit, search) => {
        const query = search ? { returnPeriod: { $regex: search, $options: 'i' } } : {};
        const skip = (page - 1) * limit;
        const [returndata, total] = await Promise.all([
            returnPolicyModule_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            returnPolicyModule_1.default.countDocuments(query),
        ]);
        return { returndata, total };
    },
    options: () => returnPolicyModule_1.default.find().select('_id returnPeriod'),
    findById: (id) => returnPolicyModule_1.default.findById(id),
    create: (data) => returnPolicyModule_1.default.create(data),
    updateById: (id, patch) => returnPolicyModule_1.default.findByIdAndUpdate(id, patch, { new: true }),
    deleteById: (id) => returnPolicyModule_1.default.findByIdAndDelete(id),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=return-policy.repository.js.map