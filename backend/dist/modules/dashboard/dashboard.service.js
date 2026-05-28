"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.overview = overview;
/** Ports src/app/api/dashboard/route.ts — admin overview with IST aggregations. */
const helpers_1 = require("@/utils/helpers");
const userModel_1 = __importDefault(require("@/db/models/userModel"));
const orderModel_1 = __importDefault(require("@/db/models/orderModel"));
const productModel_1 = __importDefault(require("@/db/models/productModel"));
const couponModel_1 = __importDefault(require("@/db/models/couponModel"));
const blogModel_1 = __importDefault(require("@/db/models/blogModel"));
const session_carts_model_1 = __importDefault(require("@/db/models/session_carts.model"));
const visitorModel_1 = __importDefault(require("@/db/models/visitorModel"));
const VALID = ['confirmed', 'shipped', 'delivered'];
async function aggSum(pipeline) {
    const r = (await orderModel_1.default.aggregate(pipeline));
    return r[0]?.value ?? 0;
}
async function aggCount(model, todayIST) {
    const r = (await model.aggregate([
        {
            $addFields: {
                istDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            },
        },
        { $match: { istDate: todayIST } },
        { $count: 'count' },
    ]));
    return r[0]?.count ?? 0;
}
async function overview() {
    const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const baseSum = (matchExtra) => [
        matchExtra,
        {
            $group: {
                _id: null,
                value: {
                    $sum: {
                        $subtract: [
                            { $add: ['$totalAmount.discountPrice', '$totalAmount.shippingTotal'] },
                            '$totalAmount.coupon_discount',
                        ],
                    },
                },
            },
        },
    ];
    const totalEarnings = await aggSum(baseSum({ $match: { status: { $in: VALID } } }));
    const dailyRevenue = await aggSum([
        {
            $addFields: {
                istDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            },
        },
        ...baseSum({ $match: { istDate: todayIST, status: { $in: VALID } } }),
    ]);
    const monthlyRevenue = await aggSum([
        {
            $addFields: {
                istMonth: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            },
        },
        ...baseSum({ $match: { istMonth: todayIST.slice(0, 7), status: { $in: VALID } } }),
    ]);
    const weekly = (await orderModel_1.default.aggregate([
        {
            $addFields: {
                istDay: { $dayOfWeek: { date: '$createdAt', timezone: 'Asia/Kolkata' } },
            },
        },
        { $match: { status: { $in: VALID } } },
        { $group: { _id: '$istDay', value: { $sum: '$totalAmount.discountPrice' } } },
    ]));
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyRevenue = {
        labels: days,
        values: days.map((_, i) => weekly.find((d) => d._id === i + 1)?.value ?? 0),
    };
    const [totalUsers, totalOrders, newOrders, totalProducts, totalCustomProducts, totalBlogs, totalCoupons, totalCarts, dailyUsers, dailyOrders, dailyCartVisitors, siteVisitors,] = await Promise.all([
        userModel_1.default.countDocuments(),
        orderModel_1.default.countDocuments({ status: { $in: VALID } }),
        orderModel_1.default.countDocuments({ status: 'confirmed' }),
        productModel_1.default.countDocuments({ isCustomize: false }),
        productModel_1.default.countDocuments({ isCustomize: true }),
        blogModel_1.default.countDocuments(),
        couponModel_1.default.countDocuments(),
        session_carts_model_1.default.countDocuments(),
        aggCount(userModel_1.default, todayIST),
        (async () => {
            const r = (await orderModel_1.default.aggregate([
                {
                    $addFields: {
                        istDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
                    },
                },
                { $match: { istDate: todayIST, status: { $in: VALID } } },
                { $count: 'count' },
            ]));
            return r[0]?.count ?? 0;
        })(),
        aggCount(session_carts_model_1.default, todayIST),
        visitorModel_1.default.countDocuments(),
    ]);
    const stats = [
        { title: 'Total Revenue', value: (0, helpers_1.formatCurrency)(totalEarnings), icon: 'ri-money-dollar-circle-line', color: 'bg-green-600' },
        { title: 'Daily Revenue', value: (0, helpers_1.formatCurrency)(dailyRevenue), icon: 'ri-line-chart-line', color: 'bg-emerald-500' },
        { title: 'Monthly Revenue', value: (0, helpers_1.formatCurrency)(monthlyRevenue), icon: 'ri-bar-chart-line', color: 'bg-rose-600' },
        { title: 'Total Users', value: totalUsers, icon: 'ri-user-3-line', color: 'bg-blue-500' },
        { title: 'Orders', value: totalOrders, icon: 'ri-shopping-cart-2-line', color: 'bg-purple-500' },
        { title: 'New Orders', value: newOrders, icon: 'ri-shopping-cart-2-line', color: 'bg-pink-500' },
        { title: 'Daily Orders', value: dailyOrders, icon: 'ri-calendar-check-line', color: 'bg-indigo-500' },
        { title: 'Products', value: totalProducts, icon: 'ri-shopping-bag-3-line', color: 'bg-orange-500' },
        { title: 'Custom Products', value: totalCustomProducts, icon: 'ri-tools-line', color: 'bg-yellow-500' },
        { title: 'Blogs', value: totalBlogs, icon: 'ri-news-line', color: 'bg-pink-500' },
        { title: 'Coupons', value: totalCoupons, icon: 'ri-gift-line', color: 'bg-red-500' },
        { title: 'Daily Users', value: dailyUsers, icon: 'ri-user-add-line', color: 'bg-purple-500' },
        { title: 'Daily Cart Visitors', value: dailyCartVisitors, icon: 'ri-shopping-cart-line', color: 'bg-purple-600' },
        { title: 'Total Carts', value: totalCarts, icon: 'ri-shopping-cart-line', color: 'bg-rose-600' },
        { title: 'Site Visitors', value: siteVisitors, icon: 'ri-user-add-line', color: 'bg-purple-800' },
    ];
    const sessionData = await session_carts_model_1.default.find().sort({ createdAt: -1 }).limit(6).populate('productId');
    return { success: true, weeklyRevenue, stats, sessionData };
}
//# sourceMappingURL=dashboard.service.js.map