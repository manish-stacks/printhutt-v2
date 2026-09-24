import type { Document, ObjectId } from './_base';

export interface IAddress extends Document {
  userId: ObjectId;
  fullName: string;
  mobileNumber: string;
  email?: string;
  alternatePhone?: string;
  addressLine: string;
  city: string;
  state: string;
  postCode: string;
  addressType: 'home' | 'work';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}


import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().min(1, "Name is required"),
  mobileNumber: z.string().min(10, "Valid mobile number required"),
  addressLine: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postCode: z.string().min(6, "Valid post code required"),
  state: z.string().min(1, "State is required"),
  alternatePhone: z.string().optional(),
  addressType: z.enum(['home', 'work']),
  //isDefault: z.boolean(),
  email: z.string().email().optional(),
  // newAddress?: boolean
});

export type AddressFormData = z.infer<typeof addressSchema> & { _id?: string; isDefault?: boolean; email?: string };