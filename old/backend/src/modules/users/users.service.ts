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
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { BadRequestError } from '@/utils/errors';
import UserCart from '@/db/models/userCartModel';

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



/* ──────────────── 4. Full user detail (all tabs) ──────────────── */
export async function userFullDetail(userId: string): Promise<unknown> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new BadRequestError('Invalid user ID');
  }
  const user = await usersRepo.findByIdLean(userId);
  if (!user) throw new NotFoundError('User not found');

  const [addresses, orders, reviews, wishlist] = await Promise.all([
    usersRepo.addressesByUser(userId),
    usersRepo.ordersByUser(userId),
    usersRepo.reviewsByUser(userId),
    usersRepo.wishlistByUser(userId),
  ]);
  const cart = await UserCart.findOne({ userId })
    .populate({
      path: 'items.productId',
      select: 'title slug price thumbnail discountPrice discountType',
    })
    .lean();
  // Payments = orders me se payment object nikaalo
  const payments = (orders as Array<Record<string, unknown>>).map((o) => ({
    orderId: o.orderId,
    payAmt: o.payAmt,
    status: o.status,
    payment: o.payment,
    createdAt: o.createdAt,
  }));

  return {
    success: true,
    user,
    addresses,
    orders,
    payments,
    reviews,
    wishlist: (wishlist as { items?: unknown[] } | null)?.items ?? [],
    cart: cart?.items ?? [],
  };
}

/* ──────────────── 5. Excel export (all users) ──────────────── */
export async function exportUsersExcel(search: string): Promise<ExcelJS.Buffer> {
  const users = (await usersRepo.allForExport(search)) as Array<Record<string, unknown>>;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PrintHutt Admin';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Users');

  sheet.columns = [
    { header: 'Name', key: 'username', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Number', key: 'number', width: 18 },
    { header: 'Verified', key: 'isVerified', width: 12 },
    { header: 'Blocked', key: 'isBlocked', width: 12 },
    { header: 'Role', key: 'role', width: 12 },
    { header: 'Created At', key: 'createdAt', width: 22 },
  ];

  // Header style
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6C7FD8' },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  users.forEach((u) => {
    sheet.addRow({
      username: u.username ?? 'N/A',
      email: u.email ?? 'N/A',
      number: u.number ?? 'N/A',
      isVerified: u.isVerified ? 'Yes' : 'No',
      isBlocked: u.isBlocked ? 'Yes' : 'No',
      role: u.role ?? 'user',
      createdAt: u.createdAt ? new Date(u.createdAt as string).toLocaleString('en-IN') : '',
    });
  });

  return workbook.xlsx.writeBuffer();
}

/* ──────────────── 6. Block / unblock user ──────────────── */
export async function setBlockStatus(
  userId: string,
  isBlocked: boolean
): Promise<unknown> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new BadRequestError('Invalid user ID');
  }
  const user = await usersRepo.setBlockStatus(userId, isBlocked);
  if (!user) throw new NotFoundError('User not found');
  return user;
}