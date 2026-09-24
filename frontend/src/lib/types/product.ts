import type { Document, ObjectId } from './_base';
import { IShippingInformation } from "./shipping";
import { ImageType } from "../types";

//  Variant image type
export interface IVariantImage {
  url: string;
  public_id?: string;
  fileType?: string;
}

// Interface for the Variant subdocument —  images add kiye
export interface IVariant {
  _id?: string;
  size: string;
  color?: string;
  price: number;
  discountPrice?: number;
  discountType?: string;
  stock: number;
  //  NEW: Flipkart-style variant-wise images
  images?: IVariantImage[];
  thumbnail?: IVariantImage;
  isMainProduct?: boolean;
}

// Interface for the Thumbnail and Image subdocuments
export interface IMedia {
  url: string;
  public_id: string;
  fileType: string;
}

// Interface for the Meta subdocument
export interface IMeta {
  meta_title?: string;
  meta_keywords?: string;
  meta_description?: string;
}

// Interface for the Product document
export interface IProduct extends Document {
  title: string;
  slug: string;
  short_description: string;
  description: string;
  category: ObjectId;
  subcategory?: ObjectId;
  price: number;
  discountType?: string;
  discountPrice: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  isTextBox?: boolean;
  textBoxCount?: number;
  isImageBox?: boolean;
  imageBoxCount?: number;
  sku: string;
  weight?: number;
  colors?: string;
  inBox?: string;
  dimensions?: string;
  isVarientStatus?: boolean;
  varient: IVariant[];
  availabilityStatus: "in_stock" | "low_stock" | "out_of_stock";
  minimumOrderQuantity: number;
  warrantyInformation?: ObjectId;
  shippingInformation?: ObjectId & IShippingInformation;
  returnPolicy?: ObjectId;
  meta: IMeta;
  thumbnail?: IMedia;
  images: IMedia[];
  reviews: ObjectId[];
  status: boolean;
  ishome: boolean;
  trending: boolean;
  hot: boolean;
  sale: boolean;
  new: boolean;
  showPrice: boolean;
  offers: ObjectId[];
  shippingFee?: number;
  isCustomize: boolean;
  demoVideo?: string;
  imgAlt?: string;
  createdAt: Date;
  updatedAt: Date;
  customizeLink: string;
}

//  ProductVariant with images
export interface ProductVariant {
  _id?: string;
  size: string;
  color: string;
  price: number;
  discountPrice?: number;
  discountType?: string;
  stock: number;
  totalPrice?: number
  images?: ImageType[];
  thumbnail?: ImageType | IMedia;
  isMainProduct?: boolean;
}

export interface ProductFormData {
  videoAsThumbnail?: boolean;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  meta_keywords: string;
  category: string;
  subcategory: string;
  price: number;
  discountType: string;
  discountPrice: number;
  rating: number;
  stock: number;
  tags: string[];
  sku: string;
  weight: number;
  availabilityStatus: string;
  minimumOrderQuantity: number;
  dimensions: string;
  warrantyInformation: string;
  shippingInformation: string;
  returnPolicy: string;
  demoVideo: string;
  imgAlt: string;
  status: boolean;
  ishome: boolean;
  trending: boolean;
  hot: boolean;
  sale: boolean;
  new: boolean;
  isCustomize: boolean;
  images: ImageType[];
  thumbnail: IMedia | string;
  keywords?: string;
  meta_description: string;
  shippingFee: string | number;
  offers: string[];
  isVarientStatus: boolean;
  varient: ProductVariant[];
  customizeLink: string;
  totalPrice?: number | string;
  meta_title?: string;
  isTextBox?: boolean;
  textBoxCount?: number;
  isImageBox?: boolean;
  imageBoxCount?: number;
  showPrice?: boolean;
}

export interface PageProductFormData {
  title: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  subcategory: string;
  price: number;
  discountType: string;
  discountPrice: number;
  rating: number;
  stock: number;
  tags: string[];
  sku: string;
  weight: number;
  availabilityStatus: string;
  minimumOrderQuantity: number;
  dimensions: string;
  warrantyInformation: string;
  shippingInformation: string;
  returnPolicy: string;
  demoVideo: string;
  imgAlt: string;
  status: boolean;
  ishome: boolean;
  trending: boolean;
  hot: boolean;
  sale: boolean;
  new: boolean;
  isCustomize: boolean;
  images: ImageType[];
  thumbnail: string | File;
  keywords: string;
  meta_description: string;
  shippingFee: string | number;
  offers: string[];
  isVarientStatus: boolean;
  varient: ProductVariant[];
}

export interface ProductUpdateData {
  title?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  category?: string;
  subcategory?: string;
  price?: number;
  discountType?: string;
  discountPrice?: number;
  rating?: number;
  stock?: number;
  tags?: string[];
  sku?: string;
  weight?: number;
  availabilityStatus?: string;
  dimensions?: string;
  warrantyInformation?: string;
  shippingInformation?: string;
  returnPolicy?: string;
  demoVideo?: string;
  imgAlt?: string;
  status?: boolean;
  ishome?: boolean;
  trending?: boolean;
  hot?: boolean;
  sale?: boolean;
  new?: boolean;
  isCustomize?: boolean;
  meta?: {
    keywords?: string;
    meta_description?: string;
  };
  shippingFee?: number;
  offers?: ObjectId[];
  isVarientStatus?: boolean;
  varient?: Array<{
    size: string;
    color: string;
    price: number;
    discountPrice?: number;
    discountType?: string;
    stock: number;
    images?: Array<{ url: string; public_id: string }>;
    thumbnail?: { url: string; public_id: string };
    isMainProduct?: boolean;
  }>;
  thumbnail?: {
    url: string;
    public_id: string;
  };
  images?: Array<{
    url: string;
    public_id: string;
  }>;
}

export interface ProductVariantLite {
  _id?: string;
  size: string;
  color?: string;
  price: number;
  discountPrice?: number;
  discountType?: string;
  stock: number;
  images?: { url: string; public_id?: string }[];
  thumbnail?: { url: string; public_id?: string };
  isMainProduct?: boolean;
}

/** Storefront product (API response shape) — cards, cart, quick view, details */
export interface Product {
  _id: string;
  title: string;
  slug: string;
  price: number;
  discountType: string;
  discountPrice: number;
  stock: number;
  status?: boolean;
  rating: number;
  category?: { _id?: string; id?: string; name: string; slug?: string };
  subcategory?: { _id?: string; name?: string; slug?: string };
  tags?: string[];
  thumbnail: { url: string; public_id?: string };
  images: { url: string; public_id?: string }[];
  varient: ProductVariantLite[];
  selectedVariant?: ProductVariantLite;
  isVarientStatus?: boolean;
  new?: boolean;
  sale?: boolean;
  hot?: boolean;
  trending?: boolean;
  showPrice?: boolean;
  isCustomize?: boolean;
  customizeLink?: string;
  shippingFee?: number;
  meta?: { meta_title?: string; meta_keywords?: string; meta_description?: string };
  reviews?: any;
  short_description?: string;
  description?: string;
  imgAlt?: string;
  brand?: string;
  sku?: string;
  quantity?: number;
  /* cart-only */
  isGift?: boolean;
  custom_data?: Record<string, any>;
  _dbItemId?: string;
  productId?: any; // wishlist populated shape
  [key: string]: any;
}
