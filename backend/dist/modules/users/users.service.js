"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminList = adminList;
exports.userDashboard = userDashboard;
exports.updateProfile = updateProfile;
/**
 * Users service. Direct port of:
 *   src/app/api/user/route.ts                  — GET (admin user list)
 *   src/app/api/v1/user/route.ts               — GET (user-dashboard counts)
 *   src/app/api/v1/user/update-profile/route.ts — POST (profile update)
 *
 * Response shapes preserved exactly.
 */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const helpers_1 = require("@/utils/helpers");
const errors_1 = require("@/utils/errors");
const users_repository_1 = require("./users.repository");
/* ──────────────── 1. Admin list ──────────────── */
async function adminList(q) {
    const { users, total } = await users_repository_1.usersRepo.adminList(q.page, q.limit, q.search);
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
async function userDashboard(userId) {
    const validStatus = ['confirmed', 'shipped', 'delivered'];
    const [totalOrders, totalAmountRaw, totalPendingOrders, totalWishlist, totalAddress,] = await Promise.all([
        users_repository_1.usersRepo.countOrdersByStatus(userId, validStatus),
        users_repository_1.usersRepo.sumOrderAmountByStatus(userId, validStatus),
        users_repository_1.usersRepo.countPendingOrders(userId),
        users_repository_1.usersRepo.countWishlist(userId),
        users_repository_1.usersRepo.countAddresses(userId),
    ]);
    const totalAmount = (0, helpers_1.formatCurrency)(totalAmountRaw || 0);
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
async function updateProfile(userId, patch) {
    const user = await users_repository_1.usersRepo.findById(userId);
    if (!user)
        throw new errors_1.NotFoundError('User not found');
    if (patch.displayName !== undefined)
        user.displayName = patch.displayName;
    if (patch.number !== undefined)
        user.number = Number(patch.number);
    if (patch.email !== undefined)
        user.email = patch.email;
    if (patch.password !== undefined) {
        const salt = await bcryptjs_1.default.genSalt(10);
        user.password = await bcryptjs_1.default.hash(patch.password, salt);
    }
    await user.save();
    // strip password (same as original)
    const obj = user.toObject();
    delete obj.password;
    return obj;
}
//# sourceMappingURL=users.service.js.map