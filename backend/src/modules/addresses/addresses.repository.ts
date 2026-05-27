import mongoose, { UpdateQuery } from 'mongoose';
import { Address } from '@/db/models/addressModel';
import User from '@/db/models/userModel';

export const addressesRepo = {
  findByUser: (userId: string) => Address.find({ userId }),
  findById: (id: string) => Address.findById(id),
  countByUser: (userId: string) => Address.countDocuments({ userId }),
  clearDefaultForUser: (userId: string) =>
    Address.updateMany({ userId }, { isDefault: false }),
  create: (data: Record<string, unknown>) => Address.create(data),
  updateById: (id: string, patch: UpdateQuery<unknown>) =>
    Address.findByIdAndUpdate(id, { $set: patch }, { new: true }),
  deleteById: (id: string) => Address.findByIdAndDelete(id),

  findUserById: (id: string) => User.findById(id),

  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
