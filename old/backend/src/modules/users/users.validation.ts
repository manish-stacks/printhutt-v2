import { z } from 'zod';

/* ─────────── GET /api/user (admin list) ─────────── */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().default(''),
});
export type ListUsersQueryDTO = z.infer<typeof listUsersQuerySchema>;

/* ─────────── POST /api/v1/user/update-profile ─────────── */
export const updateProfileSchema = z
  .object({
    displayName: z.string().optional(),
    number: z.union([z.string(), z.number()]).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
  })
  .refine(
    (d) =>
      d.displayName !== undefined ||
      d.number !== undefined ||
      d.email !== undefined ||
      d.password !== undefined,
    { message: 'At least one field must be provided' }
  );
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;

/* ─────────── PATCH /api/users/:id/block ─────────── */
export const blockUserSchema = z.object({
  isBlocked: z.boolean(),
});
export type BlockUserDTO = z.infer<typeof blockUserSchema>;