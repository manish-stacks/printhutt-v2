"use client";

import React, { useEffect, useState } from "react";
import { axiosInstance } from '@/utils/axios';
import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import UserSidebar from "@/components/user/user-sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useUserStore } from "@/store/useUserStore";

import {
  RiShoppingCartFill,
  RiHeartFill,
} from "react-icons/ri";
import { StatsCard } from "@/components/admin/dashboard/StatsCard";

const Dashboard = () => {
  const userData = useUserStore(state => state.userDetails);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get('/users/me');
        setData(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Breadcrumb title="Dashboard" />

      <section className="pb-10">
        <div className="container mx-auto flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="lg:w-1/5 w-full">
            <UserSidebar activemenu="dashboard" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">

            {/* Welcome */}
            <div className="bg-purple-600 text-white rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold">
                Welcome back 👋
              </h2>
              <p className="text-sm sm:text-base">
                {userData?.name || 'User'}
              </p>
            </div>

            {/* Profile Alert */}
            {!userData?.email && (
              <div className="bg-red-100 border border-red-300 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <p className="text-red-600 font-semibold text-sm sm:text-base">
                  Please complete your profile
                </p>
                <Link
                  href="/user/profile"
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm"
                >
                  Update Profile
                </Link>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <StatsCard
                icon={RiShoppingCartFill}
                value={data?.totalOrders || 0}
                label="Total Orders"
              />

              <StatsCard
                icon={RiHeartFill}
                value={data?.totalWishlist || 0}
                label="Wishlist Items"
              />
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default Dashboard;
