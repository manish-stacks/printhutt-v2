"use client";

import React, { useEffect, useState } from "react";
import { axiosInstance } from '@/utils/axios';
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import UserSidebar from "@/components/user/user-sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useUserStore } from "@/store/useUserStore";
import {
  RiShoppingBag2Line,
  RiHeart2Line,
  RiTimeLine,
  RiWalletLine,
  RiMapPin2Line,
  RiUser2Line,
  RiArrowRightLine,
  RiAlertLine,
} from "react-icons/ri";

interface DashboardData {
  totalOrders: number;
  totalAmount: string;
  totalWishlist: number;
  totalAddress: number;
  totalPendingOrders: number;
}

const Dashboard = () => {
  const userData = useUserStore((state) => state.userDetails);
  const logout = useUserStore((state) => state.logout);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  // console.log("User details in Dashboard:", userData); // DEBUG
  useEffect(() => {
    if (!userData) {
      logout();
      return;
    }
    
    (async () => {
      try {
        const res: any = await axiosInstance.get('/users/me');
        // Handle both unwrapped and nested response shapes
        setData(res?.data?.data || res?.data || res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  /* Profile completion calc */
  const fields = [userData?.name || userData?.username, userData?.email, userData?.number];
  const completed = fields.filter(Boolean).length;
  const profilePercent = Math.round((completed / fields.length) * 100);
  const isProfileComplete = profilePercent === 100;

  /* Stats config */
  const stats = [
    {
      label: 'Total Orders',
      value: data?.totalOrders ?? 0,
      icon: RiShoppingBag2Line,
      bg: 'bg-purple-50',
      color: 'text-purple-600',
      link: '/user/orders',
    },
    {
      label: 'Total Spent',
      value: data?.totalAmount ?? '₹0',
      icon: RiWalletLine,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
    },
    {
      label: 'Pending Orders',
      value: data?.totalPendingOrders ?? 0,
      icon: RiTimeLine,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
      link: '/user/orders',
    },
    {
      label: 'Wishlist',
      value: data?.totalWishlist ?? 0,
      icon: RiHeart2Line,
      bg: 'bg-pink-50',
      color: 'text-pink-600',
      link: '/wishlist',
    },
  ];

  /* Quick action shortcuts */
  const quickActions = [
    { label: 'Edit Profile', icon: RiUser2Line, href: '/user/profile', color: 'bg-blue-50 text-blue-600' },
    { label: 'Addresses', icon: RiMapPin2Line, href: '/user/address', color: 'bg-green-50 text-green-600' },
    { label: 'My Orders', icon: RiShoppingBag2Line, href: '/user/orders', color: 'bg-purple-50 text-purple-600' },
    { label: 'Wishlist', icon: RiHeart2Line, href: '/wishlist', color: 'bg-pink-50 text-pink-600' },
  ];

  return (
    <>
      {/* <Breadcrumb title="Dashboard" /> */}

      <section className="py-6 sm:py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="lg:w-[280px] flex-shrink-0">
            <UserSidebar activemenu="dashboard" />
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-5 min-w-0">

            {/* ─── WELCOME BANNER ─── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#3C2A6D] via-[#3C2A6D] to-[#593f9e] text-white rounded-2xl p-6 sm:p-8 shadow-md">
              <div className="relative z-10">
                <p className="text-purple-100 text-sm">Welcome back 👋</p>
                <h2 className="text-2xl sm:text-3xl font-bold mt-1 break-words">
                  {userData?.name || userData?.username || 'Guest User'}
                </h2>
                <p className="text-purple-100 text-sm mt-2 max-w-md">
                  Here&apos;s a quick overview of your account activity.
                </p>
              </div>
              {/* Decorative blurs */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -right-20 -bottom-10 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl" />
            </div>

            {/* ─── PROFILE COMPLETION ALERT ─── */}
            {!isProfileComplete && (
              <div className="bg-white border-l-4 border-amber-500 rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <RiAlertLine className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">Complete your profile</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Your profile is <span className="font-semibold">{profilePercent}%</span> complete
                        </p>
                      </div>
                      <Link
                        href="/user/profile"
                        className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        Complete now <RiArrowRightLine />
                      </Link>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                        style={{ width: `${profilePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── STATS GRID ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const card = (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-all hover:-translate-y-0.5 h-full">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                      {stat.value}
                    </p>
                  </div>
                );
                return stat.link ? (
                  <Link key={stat.label} href={stat.link} className="block">
                    {card}
                  </Link>
                ) : (
                  <div key={stat.label}>{card}</div>
                );
              })}
            </div>

            {/* ─── QUICK ACTIONS ─── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all active:scale-[0.98]"
                    >
                      <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ─── ACCOUNT INFO ─── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Account Information</h3>
                <Link
                  href="/user/profile"
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Edit
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <InfoField label="Name" value={userData?.name || userData?.username} />
                <InfoField label="Email" value={userData?.email} />
                <InfoField label="Phone" value={userData?.number} />
                <InfoField
                  label="Saved Addresses"
                  value={`${data?.totalAddress ?? 0} addresses`}
                />
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

const InfoField = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
    <p className="text-gray-800 mt-1 break-words">{value || '—'}</p>
  </div>
);

export default Dashboard;