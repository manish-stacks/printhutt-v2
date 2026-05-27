import { Document } from "mongoose";

export interface IShippingInformation extends Document {
    shippingMethod?: string;
    shippingFee?: number;
    shippingTime?: string;
    isFreeShipping: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ShippingInformation {
    mobileNumber: string;
    userName: string;
    addressLine: string;
    city: string;
    state: string;
    postCode: string;
    _id: string;
    shippingMethod: string;
    shippingFee: string | number;
    shippingTime: string;
    isFreeShipping: boolean;
    createdAt?: string;
    updatedAt?: string;
}