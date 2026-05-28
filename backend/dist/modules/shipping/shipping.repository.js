"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shippingRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const shippingInformationModel_1 = __importDefault(require("@/db/models/shippingInformationModel"));
exports.shippingRepo = {
    adminList: async (page, limit, search) => {
        const query = search ? { shippingType: { $regex: search, $options: 'i' } } : {};
        const skip = (page - 1) * limit;
        const [shipping, total] = await Promise.all([
            shippingInformationModel_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            shippingInformationModel_1.default.countDocuments(query),
        ]);
        return { shipping, total };
    },
    options: () => shippingInformationModel_1.default.find().select('_id shippingMethod'),
    findById: (id) => shippingInformationModel_1.default.findById(id),
    create: (data) => shippingInformationModel_1.default.create(data),
    updateById: (id, patch) => shippingInformationModel_1.default.findByIdAndUpdate(id, patch, { new: true }),
    deleteById: (id) => shippingInformationModel_1.default.findByIdAndDelete(id),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=shipping.repository.js.map