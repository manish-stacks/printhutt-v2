/**
 * Users service. Direct port of:
 *   src/app/api/user/route.ts                  — GET (admin user list)
 *   src/app/api/v1/user/route.ts               — GET (user-dashboard counts)
 *   src/app/api/v1/user/update-profile/route.ts — POST (profile update)
 *
 * Response shapes preserved exactly.
 */
import bcryptjs from 'bcryptjs';
import { formatCurrency } from '@/utils/helpers';
import { NotFoundError } from '@/utils/errors';
import { usersRepo } from './users.repository';
import type { ListUsersQueryDTO, UpdateProfileDTO } from './users.validation';

/* ──────────────── 1. Admin list ──────────────── */
export async function adminList(q: ListUsersQueryDTO): Promise<unknown> {
  const { users, total } = await usersRepo.adminList(q.page, q.limit, q.search);
  return {
    users,
    pagination: {
      total,
      pages: Math.ceil(total / q.limit),
      page: q.page,
      limit: q.limit,
    },
  };
}

/* ──────────────── 2. User dashboard ──────────────── */
export async function userDashboard(userId: string): Promise<unknown> {
  const validStatus = ['confirmed', 'shipped', 'delivered'];

  const [
    totalOrders,
    totalAmountRaw,
    totalPendingOrders,
    totalWishlist,
    totalAddress,
  ] = await Promise.all([
    usersRepo.countOrdersByStatus(userId, validStatus),
    usersRepo.sumOrderAmountByStatus(userId, validStatus),
    usersRepo.countPendingOrders(userId),
    usersRepo.countWishlist(userId),
    usersRepo.countAddresses(userId),
  ]);

  const totalAmount = formatCurrency(totalAmountRaw || 0);

  return {
    totalOrders,
    totalAmount,
    totalWishlist,
    totalAddress,
    totalPendingOrders,
    totalReview: 0,
    totalEarning: totalAmount, // future-ready, same as original
  };
}

/* ──────────────── 3. Update profile ──────────────── */
export async function updateProfile(
  userId: string,
  patch: UpdateProfileDTO
): Promise<unknown> {
  const user = await usersRepo.findById(userId);
  if (!user) throw new NotFoundError('User not found');

  if (patch.displayName !== undefined) user.displayName = patch.displayName;
  if (patch.number !== undefined) user.number = Number(patch.number);
  if (patch.email !== undefined) user.email = patch.email;
  if (patch.password !== undefined) {
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(patch.password, salt);
  }

  await user.save();

  // strip password (same as original)
  const obj = user.toObject() as unknown as Record<string, unknown>;
  delete obj.password;
  return obj;
}
