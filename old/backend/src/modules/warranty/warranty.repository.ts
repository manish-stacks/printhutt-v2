import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import Warranty from '@/db/models/warrantyInformationModel';

export const warrantyRepo = {
  adminList: async (page: number, limit: number, search: string) => {
    const query: FilterQuery<unknown> = search ? { warrantyType: { $regex: search, $options: 'i' } } : {};
    const skip = (page - 1) * limit;
    const [warranty, total] = await Promise.all([
      Warranty.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Warranty.countDocuments(query),
    ]);
    return { warranty, total };
  },
  options: () => Warranty.find().select('_id warrantyType'),
  findById: (id: string) => Warranty.findById(id),
  create: (data: Record<string, unknown>) => Warranty.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) => Warranty.findByIdAndUpdate(id, patch, { new: true }),
  deleteById: (id: string) => Warranty.findByIdAndDelete(id),
  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
