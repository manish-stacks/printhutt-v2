"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
//  Variant schema mein images array add kiya (Flipkart-style)
const variantSchema = new mongoose_1.Schema({
    size: { type: String, required: true },
    color: { type: String },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    discountType: { type: String },
    stock: { type: Number, required: true },
    //  NEW: Har variant ki apni images
    images: [
        {
            url: { type: String },
            public_id: { type: String },
            fileType: { type: String },
            _id: false,
        },
    ],
    //  NEW: Har variant ka apna thumbnail
    thumbnail: {
        url: { type: String },
        public_id: { type: String },
        fileType: { type: String },
    },
    isMainProduct: { type: Boolean, default: false },
});
const productSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Please add a title"],
        trim: true,
        maxlength: [100, "Title cannot be more than 100 characters"],
    },
    slug: {
        type: String,
        required: true,
    },
    short_description: {
        type: String,
        required: [true, "Please add a description"],
    },
    description: {
        type: String,
        required: [true, "Please add a description"],
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    subcategory: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SubCategory",
    },
    price: {
        type: Number,
        required: [true, "Please add a price"],
        min: [0, "Price cannot be negative"],
    },
    discountType: {
        type: String,
    },
    discountPrice: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
    stock: {
        type: Number,
        required: [true, "Please add stock quantity"],
        min: [0, "Stock cannot be negative"],
    },
    tags: [String],
    brand: {
        type: String,
        default: "PrintHutt",
    },
    sku: {
        type: String,
        required: true,
        unique: true,
    },
    weight: Number,
    colors: String,
    inBox: String,
    dimensions: String,
    isVarientStatus: Boolean,
    varient: [variantSchema],
    availabilityStatus: {
        type: String,
        enum: ["in_stock", "low_stock", "out_of_stock"],
        default: "in_stock",
    },
    minimumOrderQuantity: {
        type: Number,
        default: 1,
    },
    warrantyInformation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "WarrantyInformation",
        default: null,
    },
    shippingInformation: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ShippingInformation",
        default: null,
    },
    returnPolicy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "ReturnPolicy",
        default: null,
    },
    meta: {
        meta_title: String,
        meta_keywords: String,
        meta_description: String,
    },
    thumbnail: {
        url: String,
        public_id: String,
        fileType: String,
    },
    images: [
        {
            url: String,
            public_id: String,
            fileType: String,
            _id: false,
        },
    ],
    reviews: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    status: {
        type: Boolean,
        default: true,
    },
    ishome: {
        type: Boolean,
        default: false,
    },
    trending: {
        type: Boolean,
        default: false,
    },
    hot: {
        type: Boolean,
        default: false,
    },
    isTextBox: {
        type: Boolean,
        default: false,
    },
    isImageBox: {
        type: Boolean,
        default: false,
    },
    sale: {
        type: Boolean,
        default: false,
    },
    new: {
        type: Boolean,
        default: false,
    },
    showPrice: {
        type: Boolean,
        default: true,
    },
    offers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Offer",
        },
    ],
    shippingFee: {
        type: Number,
        required: function () {
            return (this.shippingInformation && !this.shippingInformation.isFreeShipping);
        },
    },
    isCustomize: {
        type: Boolean,
        default: false,
    },
    customizeLink: {
        type: String,
    },
    demoVideo: {
        type: String,
    },
    imgAlt: {
        type: String,
    },
}, { timestamps: true });
const Product = mongoose_1.default.models.Product ||
    mongoose_1.default.model("Product", productSchema);
exports.default = Product;
//# sourceMappingURL=productModel.js.map