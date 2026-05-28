"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewsRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const reviewModel_1 = __importDefault(require("@/db/models/reviewModel"));
const productModel_1 = __importDefault(require("@/db/models/productModel"));
exports.reviewsRepo = {
    adminList: async (page, limit, search) => {
        const query = search
            ? { review: { $regex: search, $options: 'i' } }
            : {};
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            reviewModel_1.default.find(query)
                .populate('userId', 'name email')
                .populate('productId', 'title slug thumbnail')
                .populate('orderId', 'orderId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            reviewModel_1.default.countDocuments(query),
        ]);
        return { reviews, total };
    },
    findById: (id) => reviewModel_1.default.findById(id),
    create: (data) => reviewModel_1.default.create(data),
    pushReviewIdToProduct: (productId, reviewId) => productModel_1.default.updateOne({ _id: productId }, { $push: { reviews: reviewId } }).exec(),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=reviews.repository.js.map