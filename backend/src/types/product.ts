import mongoose, { Document, Types } from "mongoose";
import { IShippingInformation } from "./shipping";
import { ImageType } from "./index";

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
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  price: number;
  discountType?: string;
  discountPrice: number;
  rating: number;
  stock: number;
  tags: string[];
  brand: string;
  isTextBox?: boolean;
  isImageBox?: boolean;
  sku: string;
  weight?: number;
  colors?: string;
  inBox?: string;
  dimensions?: string;
  isVarientStatus?: boolean;
  varient: IVariant[];
  availabilityStatus: "in_stock" | "low_stock" | "out_of_stock";
  minimumOrderQuantity: number;
  warrantyInformation?: mongoose.Types.ObjectId;
  shippingInformation?: mongoose.Types.ObjectId & IShippingInformation;
  returnPolicy?: mongoose.Types.ObjectId;
  meta: IMeta;
  thumbnail?: IMedia;
  images: IMedia[];
  reviews: mongoose.Types.ObjectId[];
  status: boolean;
  ishome: boolean;
  trending: boolean;
  hot: boolean;
  sale: boolean;
  new: boolean;
  showPrice: boolean;
  offers: mongoose.Types.ObjectId[];
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
  isImageBox?: boolean;
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
  offers?: Types.ObjectId[];
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

export type Product = {
  _id: string;
  title: string;
  price: number;
  category: {
    id: string;
    name: string;
  };
  rating: number;
  tags?: string[];
  thumbnail: {
    url: string;
  };
  varient?: {
    _id?: string;
    size: string;
    color: string;
    price: number;
    discountPrice?: number;
    discountType?: string;
    stock: number;
    images?: { url: string }[];
    thumbnail?: { url: string };
  };
  new: boolean;
  sale: boolean;
  hot: boolean;
  trending: boolean;
  images: [{ url: string }];
  discountType: string;
  discountPrice: number;
  stock: number;
  slug: string;
  isVarientStatus: boolean;
  meta?: {
    meta_title: string;
    meta_keywords: string;
    meta_description: string;
  };
  reviews?: number;
  short_description?: string;
  quantity?: number;
  sku?: string;
};