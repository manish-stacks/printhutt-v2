"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.personalizedGiftsRepo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const personalizedGiftModel_1 = __importDefault(require("@/db/models/personalizedGiftModel"));
exports.personalizedGiftsRepo = {
    storefrontList: (sectionType) => {
        const query = { isActive: true };
        if (sectionType !== 'all')
            query.sectionType = sectionType;
        return personalizedGiftModel_1.default.find(query).sort({ sortOrder: 1, createdAt: -1 });
    },
    findById: (id) => personalizedGiftModel_1.default.findById(id),
    create: (data) => personalizedGiftModel_1.default.create(data),
    isValidObjectId: (id) => mongoose_1.default.Types.ObjectId.isValid(id),
};
//# sourceMappingURL=personalized-gifts.repository.js.map