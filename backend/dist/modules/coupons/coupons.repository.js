"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponsRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const couponModel_1 = __importDefault(require("@/db/models/couponModel"));
const userModel_1 = __importDefault(require("@/db/models/userModel"));
exports.couponsRepo = {
    /* ─── Admin paginated list ─── */
    adminList: async (page, limit, search) => {
        const query = search
            ? { code: { $regex: search, $options: 'i' } }
            : {};
        const skip = (page - 1) * limit;
        const [coupons, total] = await Promise.all([
            couponModel_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            couponModel_1.default.countDocuments(query),
        ]);
        return { coupons, total };
    },
    /* ─── Storefront active coupons (visible only) ─── */
    storefrontActive: () => couponModel_1.default.find({ isActive: true, isShow: true })
        .sort({ createdAt: -1 })
        .lean(),
    /* ─── Mutations ─── */
    findById: (id) => couponModel_1.default.findById(id),
    create: (data) => couponModel_1.default.create(data),
    updateById: (id, patch) => couponModel_1.default.findByIdAndUpdate(id, patch, { new: true }),
    deleteById: (id) => couponModel_1.default.findByIdAndDelete(id),
    /* ─── Used by /apply — checks user's couponCollection ─── */
    findUserById: (userId) => userModel_1.default.findById(userId),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=coupons.repository.js.map