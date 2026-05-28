"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const personalizedGiftSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    badge: {
        type: String,
    },
    type: {
        type: String,
        enum: ["image", "video"],
        default: "image",
    },
    sectionType: {
        type: String,
        enum: ["Personalized", "Customized"],
        default: "Customized",
    },
    media: {
        url: String,
        public_id: String,
        fileType: String,
    },
    videoUrl: {
        type: String,
    },
    link: {
        type: String,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.models.PersonalizedGift ||
    mongoose_1.default.model("PersonalizedGift", personalizedGiftSchema);
//# sourceMappingURL=personalizedGiftModel.js.map