'use client';

import React, { useEffect, useState } from 'react';
import { axiosInstance } from '@/utils/axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

import LoadingSpinner from '@/components/LoadingSpinner';
import { StatsCard } from '@/components/admin/dashboard/StatsCard';
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity';

const Dashboard = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<any>(null);
  const [sessionData, setSessionData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/dashboard');
        console.log(res);
        setStats(res.stats);
        setWeeklyRevenue(res.weeklyRevenue);
        setSessionData(res.sessionData);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div className="pt-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Overview of your store performance</p>
      </div>

      {/* REVENUE CARDS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.slice(0, 3).map(stat => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* OTHER STATS */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.slice(3).map(stat => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* CHART + ACTIVITY */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* CHART CARD */}
        <div className="rounded-[18px] border border-[#eef0f4] bg-white p-6 shadow-sm transition hover:shadow-lg">

          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#1e293b]">
              Weekly Revenue
            </h2>

            <span className="text-[12px] text-[#94a3b8]">
              Last 7 days
            </span>
          </div>

          <Line
            data={{
              labels: weeklyRevenue.labels,
              datasets: [
                {
                  label: "Revenue",
                  data: weeklyRevenue.values,
                  borderColor: "#6c7fd8",
                  backgroundColor: "rgba(108,127,216,0.15)",
                  tension: 0.4,
                },
              ],
            }}
          />
        </div>

        {/* ACTIVITY */}
        <RecentActivity data={sessionData} />

      </div>
    </div>
  );
};

export default Dashboard;
