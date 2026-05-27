import mongoose from "mongoose";
/** Ports src/app/api/dashboard/route.ts — admin overview with IST aggregations. */
import { formatCurrency } from '@/utils/helpers';
import User from '@/db/models/userModel';
import Order from '@/db/models/orderModel';
import Product from '@/db/models/productModel';
import Coupon from '@/db/models/couponModel';
import Blog from '@/db/models/blogModel';
import SessionCart from '@/db/models/session_carts.model';
import VisitorModel from '@/db/models/visitorModel';

const VALID = ['confirmed', 'shipped', 'delivered'];

async function aggSum(pipeline: mongoose.PipelineStage[]): Promise<number> {
  const r = (await Order.aggregate(pipeline)) as Array<{ value?: number }>;
  return r[0]?.value ?? 0;
}

async function aggCount(model: typeof Order | typeof User | typeof SessionCart, todayIST: string): Promise<number> {
  const r = (await model.aggregate([
    {
      $addFields: {
        istDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
      },
    },
    { $match: { istDate: todayIST } },
    { $count: 'count' },
  ])) as Array<{ count?: number }>;
  return r[0]?.count ?? 0;
}

export async function overview(): Promise<unknown> {
  const todayIST = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  const baseSum = (matchExtra: Record<string, unknown>): Record<string, unknown>[] => [
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

  const totalEarnings = await aggSum(baseSum({ $match: { status: { $in: VALID } } }) as unknown as mongoose.PipelineStage[]);

  const dailyRevenue = await aggSum([
    {
      $addFields: {
        istDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
      },
    },
    ...baseSum({ $match: { istDate: todayIST, status: { $in: VALID } } }),
  ] as unknown as mongoose.PipelineStage[]);

  const monthlyRevenue = await aggSum([
    {
      $addFields: {
        istMonth: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } },
      },
    },
    ...baseSum({ $match: { istMonth: todayIST.slice(0, 7), status: { $in: VALID } } }),
  ] as unknown as mongoose.PipelineStage[]);

  const weekly = (await Order.aggregate([
    {
      $addFields: {
        istDay: { $dayOfWeek: { date: '$createdAt', timezone: 'Asia/Kolkata' } },
      },
    },
    { $match: { status: { $in: VALID } } },
    { $group: { _id: '$istDay', value: { $sum: '$totalAmount.discountPrice' } } },
  ])) as Array<{ _id: number; value: number }>;

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyRevenue = {
    labels: days,
    values: days.map((_, i) => weekly.find((d) => d._id === i + 1)?.value ?? 0),
  };

  const [
    totalUsers,
    totalOrders,
    newOrders,
    totalProducts,
    totalCustomProducts,
    totalBlogs,
    totalCoupons,
    totalCarts,
    dailyUsers,
    dailyOrders,
    dailyCartVisitors,
    siteVisitors,
  ] = await Promise.all([
    User.countDocuments(),
    Order.countDocuments({ status: { $in: VALID } }),
    Order.countDocuments({ status: 'confirmed' }),
    Product.countDocuments({ isCustomize: false }),
    Product.countDocuments({ isCustomize: true }),
    Blog.countDocuments(),
    Coupon.countDocuments(),
    SessionCart.countDocuments(),
    aggCount(User, todayIST),
    (async () => {
      const r = (await Order.aggregate([
        {
          $addFields: {
            istDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
          },
        },
        { $match: { istDate: todayIST, status: { $in: VALID } } },
        { $count: 'count' },
      ])) as Array<{ count?: number }>;
      return r[0]?.count ?? 0;
    })(),
    aggCount(SessionCart, todayIST),
    VisitorModel.countDocuments(),
  ]);

  const stats = [
    { title: 'Total Revenue', value: formatCurrency(totalEarnings), icon: 'ri-money-dollar-circle-line', color: 'bg-green-600' },
    { title: 'Daily Revenue', value: formatCurrency(dailyRevenue), icon: 'ri-line-chart-line', color: 'bg-emerald-500' },
    { title: 'Monthly Revenue', value: formatCurrency(monthlyRevenue), icon: 'ri-bar-chart-line', color: 'bg-rose-600' },
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

  const sessionData = await SessionCart.find().sort({ createdAt: -1 }).limit(6).populate('productId');
  return { success: true, weeklyRevenue, stats, sessionData };
}
