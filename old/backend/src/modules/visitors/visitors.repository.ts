import Visitor from '@/db/models/visitorModel';

export const visitorsRepo = {
  upsert: (ip: string, userAgent: string, now: Date) =>
    Visitor.findOneAndUpdate({ ip }, { lastSeen: now, userAgent }, { upsert: true, new: true }),
  removeStale: (before: Date) => Visitor.deleteMany({ lastSeen: { $lt: before } }),
  countActive: (after: Date) => Visitor.countDocuments({ lastSeen: { $gte: after } }),
};
