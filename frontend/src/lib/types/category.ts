import type { Document, ObjectId } from './_base';
import { ImageType } from '../types';

export interface ImageData {
  url: string;
  public_id: string;
  fileType: string;
}

export interface CategoryAttributes {
  name: string;
  slug: string;
  description?: string;
  metaKeywords?: string;
  metaDescription?: string;
  image?: ImageData;
  level: number;
  status: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}



export interface CategoryFormData {
  _id?: string | undefined;
  name: string;
  slug: string;
  description: string;
  metaKeywords: string;
  metaTitle:string;
  metaDescription: string;
  level: string;
  imageUrl: string | File;
  status: boolean;
  image?: ImageType;
  parentCategory?: string | null; // Specify a more specific type instead of 'any'
  productCount?: number;
  featured?: boolean;
}


export type CategoryDocument = CategoryAttributes & Document;