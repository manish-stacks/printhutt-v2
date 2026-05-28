"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.slidersRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const sliderModel_1 = __importDefault(require("@/db/models/sliderModel"));
exports.slidersRepo = {
    adminList: async (page, limit, search) => {
        const query = search
            ? { title: { $regex: search, $options: 'i' } }
            : {};
        const skip = (page - 1) * limit;
        const [sliders, total] = await Promise.all([
            sliderModel_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            sliderModel_1.default.countDocuments(query),
        ]);
        return { sliders, total };
    },
    storefrontActive: () => sliderModel_1.default.find({ isActive: true }).sort({ level: 1 }).limit(4).lean(),
    findById: (id) => sliderModel_1.default.findById(id),
    create: (data) => sliderModel_1.default.create(data),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=sliders.repository.js.map