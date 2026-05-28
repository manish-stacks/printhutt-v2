"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const testimonialsSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true
    },
    feedback: {
        type: String,
        required: true
    },
    image: {
        url: String,
        public_id: String,
        fileType: String,
    }, isActive: { type: Boolean, default: true },
}, { timestamps: true });
const Testimonials = mongoose_1.default.models.Testimonials || mongoose_1.default.model('Testimonials', testimonialsSchema);
exports.default = Testimonials;
//# sourceMappingURL=testimonialsModel.js.map