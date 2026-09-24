import mongoose, { Model, Schema } from "mongoose";
import type { IProduct, IVariant } from "@/types/product";

//  Variant schema mein images array add kiya (Flipkart-style)
const variantSchema = new Schema<IVariant>({
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

const productSchema = new Schema<IProduct>(
  {
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
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    subcategory: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: "WarrantyInformation",
      default: null,
    },
    shippingInformation: {
      type: Schema.Types.ObjectId,
      ref: "ShippingInformation",
      default: null,
    },
    returnPolicy: {
      type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
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
    textBoxCount: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    isImageBox: {
      type: Boolean,
      default: false,
    },
    imageBoxCount: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
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
        type: Schema.Types.ObjectId,
        ref: "Offer",
      },
    ],
    shippingFee: {
      type: Number,
      required: function (this: IProduct) {
        return (
          this.shippingInformation && !this.shippingInformation.isFreeShipping
        );
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
  },
  { timestamps: true }
);

// ── Performance Indexes ──────────────────────────────────────────────────
// Storefront main listing: status filter + newest first
productSchema.index({ status: 1, createdAt: -1 });

// Category/SubCategory filtering (most common storefront queries)
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ subcategory: 1, status: 1, createdAt: -1 });

// Slug lookup (product detail page)
productSchema.index({ slug: 1 }, { unique: true });

// Homepage feature flags
productSchema.index({ ishome: 1, status: 1 });
productSchema.index({ trending: 1, status: 1 });
productSchema.index({ new: 1, status: 1 });

// Text search on title + tags
productSchema.index({ title: 'text', tags: 'text' });

const Product: Model<IProduct> =
  mongoose.models.Product ||
  mongoose.model<IProduct>("Product", productSchema);

export default Product;