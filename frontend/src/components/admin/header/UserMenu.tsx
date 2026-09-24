'use client';
import { axiosInstance, setAccessToken } from '@/utils/axios';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { RiArrowDownSLine, RiLogoutBoxRLine, RiSettings3Line, RiUser3Line } from 'react-icons/ri';
import { toast } from 'react-toastify';

export function UserMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    // Network fail ho tab bhi local session clear + login pe bhejo
    const logOut = async () => {
        try {
            await axiosInstance.get('/auth/logout');
            toast.success('Logged out');
        } catch {
            toast.warn('Server se logout confirm nahi hua, local session clear kar diya');
        } finally {
            setAccessToken(null);
            window.localStorage.removeItem('user-store');
            window.location.href = '/admin/login';
        }
    };

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen((o) => !o)} aria-expanded={isOpen}
                className="flex items-center gap-2 h-10 pl-1 pr-2 sm:pr-3 rounded-xl border border-[#e8eaf0] hover:bg-gray-50">
                <span className="w-8 h-8 rounded-lg bg-[#1b1537] text-amber-400 flex items-center justify-center"><RiUser3Line size={17} /></span>
                <span className="hidden sm:block text-[13px] font-semibold text-gray-800">Admin</span>
                <RiArrowDownSLine className="text-gray-400" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#e8eaf0] shadow-xl py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-[#f0f1f5]">
                        <p className="text-[14px] font-semibold text-gray-900">PrintHutt Admin</p>
                        <p className="text-[12px] text-gray-500">Store owner</p>
                    </div>
                    <Link href="/admin/profile-settings" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50">
                        <RiSettings3Line size={17} /> Profile settings
                    </Link>
                    <button onClick={logOut} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-rose-600 hover:bg-rose-50">
                        <RiLogoutBoxRLine size={17} /> Logout
                    </button>
                </div>
            )}
        </div>
    );
}
