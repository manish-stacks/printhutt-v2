"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.warrantyRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const warrantyInformationModel_1 = __importDefault(require("@/db/models/warrantyInformationModel"));
exports.warrantyRepo = {
    adminList: async (page, limit, search) => {
        const query = search ? { warrantyType: { $regex: search, $options: 'i' } } : {};
        const skip = (page - 1) * limit;
        const [warranty, total] = await Promise.all([
            warrantyInformationModel_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            warrantyInformationModel_1.default.countDocuments(query),
        ]);
        return { warranty, total };
    },
    options: () => warrantyInformationModel_1.default.find().select('_id warrantyType'),
    findById: (id) => warrantyInformationModel_1.default.findById(id),
    create: (data) => warrantyInformationModel_1.default.create(data),
    updateById: (id, patch) => warrantyInformationModel_1.default.findByIdAndUpdate(id, patch, { new: true }),
    deleteById: (id) => warrantyInformationModel_1.default.findByIdAndDelete(id),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=warranty.repository.js.map