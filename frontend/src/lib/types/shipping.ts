import type { Document, ObjectId } from './_base';

export interface IShippingInformation extends Document {
    shippingMethod?: string;
    shippingFee?: number;
    shippingTime?: string;
    isFreeShipping: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface ShippingInformation {
    mobileNumber: any;
    userName: any;
    addressLine: any;
    city: any;
    state: any;
    postCode: any;
    _id: string;
    shippingMethod: string;
    shippingFee: string | number;
    shippingTime: string;
    isFreeShipping: boolean;
    createdAt?: string;
    updatedAt?: string;
}