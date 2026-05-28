"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const wishlistModel_1 = __importDefault(require("@/db/models/wishlistModel"));
exports.wishlistRepo = {
    findByUser: (userId) => wishlistModel_1.default.findOne({ userId }),
    findByUserPopulated: (userId) => wishlistModel_1.default.findOne({ userId }).populate('items.productId'),
    createForUser: (userId, productId) => wishlistModel_1.default.create({ userId, items: [{ productId }] }),
    hasProduct: (userId, productId) => wishlistModel_1.default.findOne({
        userId,
        items: { $elemMatch: { productId } },
    }),
    addProduct: (userId, productId) => wishlistModel_1.default.updateOne({ userId }, { $addToSet: { items: { productId } } }),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=wishlist.repository.js.map