"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { axiosInstance } from '@/utils/axios';
import { toast } from 'react-toastify';
import Link from 'next/link';
import {
  RiHeart3Line, RiSearchLine, RiEyeLine, RiMailSendLine,
  RiUser3Line, RiTimeLine,
} from 'react-icons/ri';
import MessageComposerModal from '@/components/admin/MessageComposerModal';

interface WishlistRow {
  userId: string;
  userName: string;
  userEmail: string;
  userNumber: string;
  itemCount: number;
  lastAdded: string;
}

export default function AdminWishlistsPage() {
  const [rows, setRows] = useState<WishlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [messageUser, setMessageUser] = useState<WishlistRow | null>(null);

  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res: any = await axiosInstance.get('/wishlist/admin/all', {
        params: { page, limit, search },
      });
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      toast.error('Failed to fetch wishlists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchData, 300); // debounce search
    return () => clearTimeout(t);
  }, [search, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiHeart3Line className="text-purple-600" /> Wishlists
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} users have items in wishlist
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-600">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3 text-center">Items</th>
                <th className="px-5 py-3">Last Added</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No wishlists found</td></tr>
              ) : rows.map((row) => (
                <tr key={row.userId} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-semibold">
                        {row.userName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="font-medium text-gray-900">{row.userName || 'Guest'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{row.userEmail || '—'}</td>
                  <td className="px-5 py-4 text-gray-600">{row.userNumber || '—'}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                      {row.itemCount}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    <div className="flex items-center gap-1">
                      <RiTimeLine className="w-3.5 h-3.5" />
                      {new Date(row.lastAdded).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/wishlists/${row.userId}`}
                        className="p-2 rounded-lg hover:bg-purple-50 text-gray-500 hover:text-purple-600 transition"
                        title="View Items"
                      >
                        <RiEyeLine className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setMessageUser(row)}
                        className="p-2 rounded-lg hover:bg-pink-50 text-gray-500 hover:text-pink-600 transition"
                        title="Send Message"
                      >
                        <RiMailSendLine className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message modal */}
      {messageUser && (
        <MessageComposerModal
          user={messageUser}
          onClose={() => setMessageUser(null)}
          onSent={() => {
            setMessageUser(null);
            toast.success('Message sent!');
          }}
        />
      )}
    </div>
  );
}