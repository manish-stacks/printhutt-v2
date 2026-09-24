import mongoose, { FilterQuery, UpdateQuery } from 'mongoose';
import ReturnPolicy from '@/db/models/returnPolicyModule';

export const returnPolicyRepo = {
  adminList: async (page: number, limit: number, search: string) => {
    const query: FilterQuery<unknown> = search ? { returnPeriod: { $regex: search, $options: 'i' } } : {};
    const skip = (page - 1) * limit;
    const [returndata, total] = await Promise.all([
      ReturnPolicy.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ReturnPolicy.countDocuments(query),
    ]);
    return { returndata, total };
  },
  options: () => ReturnPolicy.find().select('_id returnPeriod'),
  findById: (id: string) => ReturnPolicy.findById(id),
  create: (data: Record<string, unknown>) => ReturnPolicy.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) => ReturnPolicy.findByIdAndUpdate(id, patch, { new: true }),
  deleteById: (id: string) => ReturnPolicy.findByIdAndDelete(id),
  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
