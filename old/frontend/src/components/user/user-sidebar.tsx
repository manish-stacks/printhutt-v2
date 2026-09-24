'use client';

import { useUserStore } from '@/store/useUserStore';
import Link from 'next/link';
import React from 'react';
import {
  RiHome2Line,
  RiUser2Line,
  RiMapPin2Line,
  RiHeart2Line,
  RiShoppingBag2Line,
  RiLogoutBoxRLine,
} from 'react-icons/ri';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface Props {
  activemenu: string;
}

const MENU_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: RiHome2Line, href: '/user/dashboard' },
  { key: 'profile', label: 'My Profile', icon: RiUser2Line, href: '/user/profile' },
  { key: 'address', label: 'Addresses', icon: RiMapPin2Line, href: '/user/address' },
  { key: 'wishlist', label: 'Wishlist', icon: RiHeart2Line, href: '/wishlist' },
  { key: 'orders', label: 'Order History', icon: RiShoppingBag2Line, href: '/user/orders' },
];

const UserSidebar = ({ activemenu }: Props) => {
  const userData = useUserStore((state) => state.userDetails);
  const logoutStore = useUserStore((state) => state.logout);

  /* Initials for avatar */
  const fullName: string = userData?.name || userData?.username || 'Guest User';
  const initials = fullName
    .split(' ')
    .map((p: string) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#999',
      confirmButtonText: 'Yes, logout',
    });
    if (!result.isConfirmed) return;

    await logoutStore();
    toast.success('Logged out successfully');
    window.localStorage.removeItem('user-store');
    window.location.reload();
  };

  return (
    <aside className="w-full">
      {/* ─── USER CARD ─── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#3C2A6D] to-[#3C2A6D] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{fullName}</h3>
            <p className="text-xs text-gray-500 truncate">
              {userData?.email || userData?.number || 'No contact info'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── MOBILE: horizontal tab strip ─── */}
      <div className="lg:hidden bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {MENU_ITEMS.map((item) => {
            const active = activemenu === item.key;
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-[#3C2A6D] text-white shadow-md shadow-purple-200'
                    : 'text-gray-600 hover:bg-purple-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ─── DESKTOP: vertical menu ─── */}
      <nav className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
        {MENU_ITEMS.map((item) => {
          const active = activemenu === item.key;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition mb-1 ${
                active
                  ? 'bg-[#3C2A6D] text-white shadow-md shadow-purple-200'
                  : 'text-gray-600 hover:bg-purple-50 hover:text-[#3C2A6D]'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? '' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}

        {/* Divider */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            <RiLogoutBoxRLine className="w-5 h-5" />
            Logout
          </button>
        </div>
      </nav>

      {/* ─── MOBILE: logout button ─── */}
      <div className="lg:hidden mt-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 hover:bg-red-50 py-2.5 rounded-xl text-sm font-medium transition"
        >
          <RiLogoutBoxRLine className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default UserSidebar;