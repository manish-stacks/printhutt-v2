import User from '@/db/models/userModel';

/**
 * Auth repository. Thin wrapper around the User model.
 * All Mongoose calls live here so the service stays mongoose-free.
 */
export const authRepo = {
  findByEmail: (email: string) => User.findOne({ email }),

  findByNumber: (number: string | number) => User.findOne({ number }),

  findByEmailOrNumber: (key: 'email' | 'number', value: string | number) =>
    User.findOne({ [key]: value }),

  findById: (id: string) => User.findById(id),

  findByVerifyToken: (token: string) =>
    User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: Date.now() },
    }),

  create: (data: Record<string, unknown>) => User.create(data),
};
