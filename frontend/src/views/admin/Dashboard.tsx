'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import {
  RiMoneyRupeeCircleLine, RiLineChartLine, RiBarChartBoxLine, RiShoppingCart2Line, RiInboxArchiveLine,
  RiCalendarCheckLine, RiUser3Line, RiUserAddLine, RiEyeLine, RiShoppingBag3Line, RiToolsLine,
  RiArticleLine, RiCoupon3Line, RiShoppingBasketLine, RiAddLine, RiTimeLine, RiRefreshLine, RiArrowRightUpLine,
} from 'react-icons/ri';
import { axiosInstance } from '@/utils/axios';

type Stat = { title: string; value: string | number };

const ICONS: Record<string, React.ElementType> = {
  'Total Revenue': RiMoneyRupeeCircleLine, 'Daily Revenue': RiLineChartLine, 'Monthly Revenue': RiBarChartBoxLine,
  'Orders': RiShoppingCart2Line, 'New Orders': RiInboxArchiveLine, 'Daily Orders': RiCalendarCheckLine,
  'Total Users': RiUser3Line, 'Daily Users': RiUserAddLine, 'Site Visitors': RiEyeLine,
  'Products': RiShoppingBag3Line, 'Custom Products': RiToolsLine, 'Blogs': RiArticleLine, 'Coupons': RiCoupon3Line,
  'Daily Cart Visitors': RiShoppingBasketLine, 'Total Carts': RiShoppingCart2Line,
};

const GROUPS: { title: string; items: string[]; link?: string }[] = [
  { title: 'Orders', items: ['Orders', 'New Orders', 'Daily Orders'], link: '/admin/orders?status=all' },
  { title: 'Customers & traffic', items: ['Total Users', 'Daily Users', 'Site Visitors'], link: '/admin/customer-list' },
  { title: 'Carts', items: ['Daily Cart Visitors', 'Total Carts'], link: '/admin/user-cart' },
  { title: 'Catalog & content', items: ['Products', 'Custom Products', 'Blogs', 'Coupons'], link: '/admin/products' },
];

const QUICK = [
  { label: 'Add product', path: '/admin/products/new', icon: RiAddLine },
  { label: 'Pending orders', path: '/admin/orders?status=pending', icon: RiTimeLine },
  { label: 'Coupons', path: '/admin/coupons', icon: RiCoupon3Line },
  { label: 'Clear cache', path: '/admin/cache-clear', icon: RiRefreshLine },
];

const greet = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

const Skeleton = ({ className = '' }: { className?: string }) => <div className={`animate-pulse rounded-2xl bg-[#eceef4] ${className}`} />;

const Dashboard = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [weekly, setWeekly] = useState<{ labels: string[]; values: number[] } | null>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true); setError('');
      const res: any = await axiosInstance.get('/dashboard');
      setStats(res?.stats || []);
      setWeekly(res?.weeklyRevenue || null);
      setActivity(res?.sessionData || []);
    } catch (e: any) {
      setError(e?.message || 'Dashboard load nahi hua');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const byTitle = useMemo(() => Object.fromEntries(stats.map((s) => [s.title, s.value])), [stats]);
  const weekTotal = (weekly?.values || []).reduce((a, b) => a + (Number(b) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-gray-500">{greet()} 👋</p>
          <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-gray-900 leading-tight">Store overview</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <Link key={q.path} href={q.path} className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-[#e8eaf0] bg-white text-[13px] font-semibold text-gray-700 hover:border-indigo-300 hover:text-indigo-700">
              <q.icon size={16} /> {q.label}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-700">
          {error}
          <button onClick={load} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Revenue hero */}
      <div className="grid gap-4 lg:grid-cols-3">
        {loading ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[124px]" />) :
          ['Total Revenue', 'Monthly Revenue', 'Daily Revenue'].map((t, i) => {
            const Icon = ICONS[t];
            const dark = i === 0;
            return (
              <div key={t} className={`relative overflow-hidden rounded-2xl p-5 ${dark ? 'bg-[#1b1537] text-white' : 'bg-white border border-[#e8eaf0]'}`}>
                {dark && <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-amber-400/15 blur-2xl" />}
                <div className="relative flex items-start justify-between">
                  <p className={`text-[13px] font-semibold ${dark ? 'text-white/60' : 'text-gray-500'}`}>{t}</p>
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${dark ? 'bg-amber-400 text-[#1b1537]' : 'bg-indigo-50 text-indigo-600'}`}><Icon size={20} /></span>
                </div>
                <p className={`relative mt-3 text-[28px] sm:text-[32px] font-bold tracking-tight tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>{byTitle[t] ?? '—'}</p>
              </div>
            );
          })}
      </div>

      {/* Grouped KPIs */}
      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((g) => (
          <section key={g.title} className="rounded-2xl bg-white border border-[#e8eaf0] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-gray-900">{g.title}</h2>
              {g.link && <Link href={g.link} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-indigo-600 hover:underline">View <RiArrowRightUpLine /></Link>}
            </div>
            <div className={`grid gap-3 ${g.items.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : g.items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {g.items.map((t) => {
                const Icon = ICONS[t] || RiBarChartBoxLine;
                return (
                  <div key={t} className="rounded-xl bg-[#f7f8fb] px-3 py-3">
                    <Icon size={18} className="text-gray-400" />
                    {loading ? <Skeleton className="h-7 w-16 mt-2 !rounded-md" /> :
                      <p className="mt-1.5 text-[22px] font-bold text-gray-900 tabular-nums leading-none">{byTitle[t] ?? 0}</p>}
                    <p className="mt-1.5 text-[12px] font-medium text-gray-500 leading-tight">{t}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Chart + activity */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl bg-white border border-[#e8eaf0] p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Weekly revenue</h2>
              <p className="text-[13px] text-gray-500">Last 7 days</p>
            </div>
            <p className="text-[22px] font-bold text-gray-900 tabular-nums">₹{weekTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="h-[260px] sm:h-[300px]">
            {loading || !weekly ? <Skeleton className="h-full" /> : (
              <Line
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ₹${Number(c.raw).toLocaleString('en-IN')}` } } },
                  scales: {
                    x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 12 } } },
                    y: { grid: { color: '#f0f1f5' }, border: { display: false }, ticks: { color: '#6b7280', font: { size: 12 }, callback: (v) => `₹${Number(v).toLocaleString('en-IN')}` } },
                  },
                }}
                data={{
                  labels: weekly.labels,
                  datasets: [{
                    data: weekly.values,
                    borderColor: '#4f46e5',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#4f46e5',
                    pointRadius: 4,
                    fill: true,
                    backgroundColor: (ctx: any) => {
                      const { chart } = ctx; const a = chart.chartArea;
                      if (!a) return 'rgba(79,70,229,.1)';
                      const g = chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
                      g.addColorStop(0, 'rgba(79,70,229,.22)'); g.addColorStop(1, 'rgba(79,70,229,0)');
                      return g;
                    },
                    tension: 0.35,
                  }],
                }}
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-[#e8eaf0] p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Live cart activity</h2>
              <p className="text-[13px] text-gray-500">Latest products added to carts</p>
            </div>
            <Link href="/admin/se_cart" className="text-[13px] font-semibold text-indigo-600 hover:underline">All</Link>
          </div>
          <ul className="divide-y divide-[#f0f1f5]">
            {loading ? [0, 1, 2, 3].map((i) => <li key={i} className="py-3"><Skeleton className="h-10" /></li>) :
              activity.length === 0 ? <li className="py-10 text-center text-[14px] text-gray-400">No recent activity</li> :
                activity.map((a, i) => (
                  <li key={a?._id || i} className="flex items-center gap-3 py-3">
                    <span className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-[#f5f6fa] border border-[#e8eaf0]">
                      {a?.productId?.thumbnail?.url && <Image src={a.productId.thumbnail.url} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">{a?.productId?.title || 'Deleted product'}</p>
                      <p className="text-[12px] text-gray-500">{a?.createdAt ? new Date(a.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                    </div>
                  </li>
                ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
