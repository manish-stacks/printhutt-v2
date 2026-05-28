"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testimonialsRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const testimonialsModel_1 = __importDefault(require("@/db/models/testimonialsModel"));
exports.testimonialsRepo = {
    adminList: async (page, limit, search) => {
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};
        const skip = (page - 1) * limit;
        const [testimonials, total] = await Promise.all([
            testimonialsModel_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            testimonialsModel_1.default.countDocuments(query),
        ]);
        return { testimonials, total };
    },
    storefrontRecent: () => testimonialsModel_1.default.find().sort({ createdAt: -1 }).limit(4).lean(),
    findById: (id) => testimonialsModel_1.default.findById(id),
    create: (data) => testimonialsModel_1.default.create(data),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=testimonials.repository.js.map