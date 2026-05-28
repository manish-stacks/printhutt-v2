"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRepo = void 0;
const userModel_1 = __importDefault(require("@/db/models/userModel"));
const orderModel_1 = __importDefault(require("@/db/models/orderModel"));
const wishlistModel_1 = __importDefault(require("@/db/models/wishlistModel"));
const addressModel_1 = require("@/db/models/addressModel");
/**
 * Users repository.
 * Used by the admin user listing and the v1 user-dashboard aggregations.
 */
exports.usersRepo = {
    /* ─── admin list — page + search, excluding role:admin ─── */
    adminList: async (page, limit, search) => {
        const query = { role: { $ne: 'admin' } };
        if (search) {
            query.username = {
                $regex: search,
                $options: 'i',
            };
        }
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            userModel_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            userModel_1.default.countDocuments(query),
        ]);
        return { users, total };
    },
    /* ─── single read / update ─── */
    findById: (id) => userModel_1.default.findById(id),
    /* ─── dashboard counters for /api/v1/user ─── */
    countOrdersByStatus: (userId, statuses) => orderModel_1.default.countDocuments({ userId, status: { $in: statuses } }),
    countPendingOrders: (userId) => orderModel_1.default.countDocuments({ userId, status: 'pending' }),
    sumOrderAmountByStatus: async (userId, statuses) => {
        const result = (await orderModel_1.default.aggregate([
            { $match: { userId, status: { $in: statuses } } },
            { $group: { _id: null, total: { $sum: '$payAmt' } } },
        ]));
        return result[0]?.total ?? 0;
    },
    countWishlist: (userId) => wishlistModel_1.default.countDocuments({ userId }),
    countAddresses: (userId) => addressModel_1.Address.countDocuments({ userId }),
};
//# sourceMappingURL=users.repository.js.map