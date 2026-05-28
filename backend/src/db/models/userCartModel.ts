import mongoose, { Schema, Model } from 'mongoose';

export interface IUserCartItem {
  productId: mongoose.Types.ObjectId;
  variantId?: string;        // variant._id (agar select kiya)
  size?: string;
  color?: string;
  quantity: number;
  price: number;             // snapshot at add-time (variant ya product)
  custom_data?: Record<string, unknown>;  // name1, previewCanvas, etc.
}

export interface IUserCart {
  userId: mongoose.Types.ObjectId;
  items: IUserCartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const userCartItemSchema = new Schema<IUserCartItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: String },
    size: { type: String },
    color: { type: String },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true },
    custom_data: { type: Schema.Types.Mixed },
  },
  { _id: true }
);

const userCartSchema = new Schema<IUserCart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [userCartItemSchema],
  },
  { timestamps: true }
);

const UserCart: Model<IUserCart> =
  mongoose.models.UserCart || mongoose.model<IUserCart>('UserCart', userCartSchema);

export default UserCart;