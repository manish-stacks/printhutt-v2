"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.offersRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const offerModel_1 = __importDefault(require("@/db/models/offerModel"));
exports.offersRepo = {
    adminList: async (page, limit, search) => {
        const query = search
            ? { offerTitle: { $regex: search, $options: 'i' } }
            : {};
        const skip = (page - 1) * limit;
        const [offers, total] = await Promise.all([
            offerModel_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            offerModel_1.default.countDocuments(query),
        ]);
        return { offers, total };
    },
    findById: (id) => offerModel_1.default.findById(id),
    fetchOptions: () => offerModel_1.default.find().select('_id offerTitle'),
    create: (data) => offerModel_1.default.create(data),
    updateById: (id, patch) => offerModel_1.default.findByIdAndUpdate(id, patch, { new: true, runValidators: true }),
    deleteById: (id) => offerModel_1.default.findByIdAndDelete(id),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=offers.repository.js.map