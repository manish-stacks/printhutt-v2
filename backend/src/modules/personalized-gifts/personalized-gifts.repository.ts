import mongoose, { FilterQuery } from 'mongoose';
import PersonalizedGift from '@/db/models/personalizedGiftModel';

export const personalizedGiftsRepo = {
  storefrontList: (sectionType: string) => {
    const query: FilterQuery<unknown> = { isActive: true };
    if (sectionType !== 'all') (query as Record<string, unknown>).sectionType = sectionType;
    return PersonalizedGift.find(query).sort({ sortOrder: 1, createdAt: -1 });
  },
  findById: (id: string) => PersonalizedGift.findById(id),
  create: (data: Record<string, unknown>) => PersonalizedGift.create(data),
  isValidObjectId: (id: string): boolean => mongoose.Types.ObjectId.isValid(id),
};
