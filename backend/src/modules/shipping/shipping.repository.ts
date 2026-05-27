import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import Shipping from '@/db/models/shippingInformationModel';

export const shippingRepo = {
  adminList: async (page: number, limit: number, search: string) => {
    const query: FilterQuery<unknown> = search ? { shippingType: { $regex: search, $options: 'i' } } : {};
    const skip = (page - 1) * limit;
    const [shipping, total] = await Promise.all([
      Shipping.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Shipping.countDocuments(query),
    ]);
    return { shipping, total };
  },
  options: () => Shipping.find().select('_id shippingMethod'),
  findById: (id: string) => Shipping.findById(id),
  create: (data: Record<string, unknown>) => Shipping.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) => Shipping.findByIdAndUpdate(id, patch, { new: true }),
  deleteById: (id: string) => Shipping.findByIdAndDelete(id),
  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
