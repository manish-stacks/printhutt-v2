"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { axiosInstance } from '@/utils/axios';
import { toast } from 'react-toastify';
import {
    RiHeart3Line, RiSearchLine, RiEyeLine, RiMailSendLine,
    RiTimeLine, RiCloseLine,
} from 'react-icons/ri';
import Image from 'next/image';
import { formatCurrency } from '@/helpers/helpers';
import MessageComposerModal from '@/components/admin/MessageComposerModal';
import { Pagination } from '@/components/admin/Pagination';
// ← Apne project ke Pagination component se replace karo
// import Pagination from '@/components/admin/Pagination';

interface WishlistRow {
    userId: string;
    userName: string;
    userEmail: string;
    userNumber: string;
    itemCount: number;
    lastAdded: string;
}

interface WishlistItem {
    _id: string;
    productId: {
        _id: string;
        title: string;
        slug: string;
        price: number;
        discountPrice?: number;
        thumbnail?: { url: string };
    };
    createdAt: string;
}

export default function AdminWishlistsPage() {
    const [rows, setRows] = useState<WishlistRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);

    const [messageUser, setMessageUser] = useState<WishlistRow | null>(null);
    const [viewUser, setViewUser] = useState<WishlistRow | null>(null);
    const [viewItems, setViewItems] = useState<WishlistItem[]>([]);
    const [viewLoading, setViewLoading] = useState(false);


    useEffect(() => {
        const t = setTimeout(fetchData, 300);
        return () => clearTimeout(t);
    }, [search, page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res: any = await axiosInstance.get('/wishlist/admin/all', {
                params: { page, limit, search },
            });

            // 🔍 DEBUG — exact response shape dekho
            console.log('[wishlists] fetchData response:', res);

            // Handle different response shapes
            const data = res?.data || res?.rows || [];
            const totalCount = res?.total ?? res?.totalCount ?? 0;

            setRows(Array.isArray(data) ? data : []);
            setTotal(Number(totalCount) || 0);
        } catch (e) {
            console.error('[wishlists] fetchData error:', e);
            toast.error('Failed to fetch wishlists');
        } finally {
            setLoading(false);
        }
    };

    const openViewModal = async (user: WishlistRow) => {
        setViewUser(user);
        setViewLoading(true);
        setViewItems([]);
        try {
            const res: any = await axiosInstance.get(`/wishlist/admin/user/${user.userId}`);

            // 🔍 DEBUG — yahaan se pata chalega kya aaya
            console.log('[wishlists] view items response:', res);

            // Multiple shape support
            const items = res?.items || res?.data || res?.wishlist || [];
            setViewItems(Array.isArray(items) ? items : []);
        } catch (e: any) {
            console.error('[wishlists] view items error:', e);
            toast.error(e?.response?.data?.message || e?.message || 'Failed to load items');
        } finally {
            setViewLoading(false);
        }
    };





    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <RiHeart3Line className="text-purple-600" /> Wishlists
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{total} users with wishlist items</p>
                </div>

                <div className="relative w-full sm:w-80">
                    <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, number..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500"
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
                                <tr key={row.userId} className="hover:bg-gray-50/50">
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
                                        <span className="inline-flex bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold">
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
                                            {/* 🔥 View modal — page open nahi karega */}
                                            <button
                                                onClick={() => openViewModal(row)}
                                                className="p-2 rounded-lg hover:bg-purple-50 text-gray-500 hover:text-purple-600"
                                                title="View Items"
                                            >
                                                <RiEyeLine className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setMessageUser(row)}
                                                className="p-2 rounded-lg hover:bg-pink-50 text-gray-500 hover:text-pink-600"
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

                {/* 🔥 Pagination component — same as other admin pages */}
                {totalPages > 1 && (
                    <div className="border-t border-gray-100 pb-4">
                        <Pagination
                            pagination={{ page, pages: totalPages, total }}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            {/* Message modal */}
            {messageUser && (
                <MessageComposerModal
                    user={messageUser}
                    onClose={() => setMessageUser(null)}
                    onSent={() => { setMessageUser(null); toast.success('Message sent!'); }}
                />
            )}

            {/* View Items modal */}
            {viewUser && (
                <ViewWishlistModal
                    user={viewUser}
                    items={viewItems}
                    loading={viewLoading}
                    onClose={() => { setViewUser(null); setViewItems([]); }}
                />
            )}
        </div>
    );
}

/* ─── View Modal Component ─── */
const ViewWishlistModal = ({
    user, items, loading, onClose,
}: {
    user: WishlistRow;
    items: WishlistItem[];
    loading: boolean;
    onClose: () => void;
}) => {
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onEsc);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onEsc);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-900">Wishlist Items</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            <span className="font-medium">{user.userName || 'Guest'}</span> · {items.length} items
                        </p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                        <RiCloseLine className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Loading...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">No items in wishlist</div>
                    ) : (
                        <ul className="space-y-3">
                            {items.map((item) => (
                                <li key={item._id} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    {item.productId?.thumbnail?.url && (
                                        <Image
                                            src={item.productId.thumbnail.url}
                                            alt={item.productId.title}
                                            width={64}
                                            height={64}
                                            className="w-16 h-16 rounded-lg object-cover bg-white border border-gray-200 flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: item.productId?.title || 'Unknown product' }}
                                        />
                                        <p className="text-sm font-bold text-purple-600 mt-1">
                                            {formatCurrency(item.productId?.price || 0)}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                            Added: {new Date(item.createdAt).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};