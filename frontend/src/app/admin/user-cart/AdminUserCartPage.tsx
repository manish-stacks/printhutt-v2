"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { axiosInstance } from '@/utils/axios';
import { toast } from 'react-toastify';
import {
    RiShoppingCart2Line, RiSearchLine, RiEyeLine, RiMailSendLine,
    RiTimeLine, RiCloseLine,
} from 'react-icons/ri';
import Image from 'next/image';
import { formatCurrency } from '@/helpers/helpers';
import MessageComposerModal from '@/components/admin/MessageComposerModal';
import { Pagination } from '@/components/admin/Pagination';
import Link from 'next/link';

interface CartRow {
    userId: string;
    userName: string;
    userEmail: string;
    userNumber: string;
    itemCount: number;
    totalQuantity: number;
    totalValue: number;
    lastUpdated: string;
}

interface CartItem {
    productId: {
        _id: string;
        title: string;
        slug: string;
        price: number;
        thumbnail?: { url: string };
    };
    variantId?: string;
    size?: string;
    color?: string;
    quantity: number;
    price: number;
    custom_data?: Record<string, any>;
}

export default function AdminUserCartPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

    const [rows, setRows] = useState<CartRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [limit] = useState(20);

    const [messageUser, setMessageUser] = useState<CartRow | null>(null);
    const [viewUser, setViewUser] = useState<CartRow | null>(null);
    const [viewItems, setViewItems] = useState<CartItem[]>([]);
    const [viewLoading, setViewLoading] = useState(false);

    /* URL sync */
    useEffect(() => {
        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (search) params.set('search', search);
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, [page, search]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res: any = await axiosInstance.get('/usercart/admin/all', {
                params: { page, limit, search },
            });
            setRows(Array.isArray(res?.data) ? res.data : []);
            setTotal(Number(res?.total) || 0);
        } catch (e: any) {
            console.error('[user-cart] fetch error:', e);
            toast.error(e?.response?.data?.message || 'Failed to fetch carts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchData, 300);
        return () => clearTimeout(t);
    }, [search, page]);

    const openViewModal = async (user: CartRow) => {
        setViewUser(user);
        setViewLoading(true);
        setViewItems([]);
        try {
            const res: any = await axiosInstance.get(`/usercart/admin/user/${user.userId}`);
            const items = res?.items || [];
            setViewItems(Array.isArray(items) ? items : []);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Failed to load cart items');
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
                        <RiShoppingCart2Line className="text-purple-600" /> User Carts
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{total} users with cart items (abandoned)</p>
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
                                <th className="px-5 py-3 text-center">Qty</th>
                                <th className="px-5 py-3 text-right">Total Value</th>
                                <th className="px-5 py-3">Last Updated</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">Loading...</td></tr>
                            ) : rows.length === 0 ? (
                                <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">No carts found</td></tr>
                            ) : rows.map((row) => (
                                <tr key={row.userId} className="hover:bg-gray-50/50">
                                    <td className="px-5 py-4">
                                        <Link href={`/admin/users/${row.userId}`}>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-semibold">
                                                    {row.userName?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <span className="font-medium text-gray-900">{row.userName || 'Guest'}</span>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600">{row.userEmail || '—'}</td>
                                    <td className="px-5 py-4 text-gray-600">{row.userNumber || '—'}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="inline-flex bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                            {row.itemCount}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="text-gray-700 font-medium">{row.totalQuantity}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <span className="font-bold text-green-700">{formatCurrency(row.totalValue)}</span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-500 text-xs">
                                        <div className="flex items-center gap-1">
                                            <RiTimeLine className="w-3.5 h-3.5" />
                                            {new Date(row.lastUpdated).toLocaleDateString('en-IN', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openViewModal(row)}
                                                className="p-2 rounded-lg hover:bg-purple-50 text-gray-500 hover:text-purple-600"
                                                title="View Cart"
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
                    user={messageUser as any}
                    onClose={() => setMessageUser(null)}
                    onSent={() => { setMessageUser(null); toast.success('Message sent!'); }}
                />
            )}

            {/* View modal */}
            {viewUser && (
                <ViewCartModal
                    user={viewUser}
                    items={viewItems}
                    loading={viewLoading}
                    onClose={() => { setViewUser(null); setViewItems([]); }}
                />
            )}
        </div>
    );
}

/* ─── View Cart Modal ─── */
const ViewCartModal = ({
    user, items, loading, onClose,
}: {
    user: CartRow;
    items: CartItem[];
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

    const grandTotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-900">Cart Items</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            <span className="font-medium">{user.userName || 'Guest'}</span> · {items.length} items · Total: <span className="font-bold text-green-700">{formatCurrency(grandTotal)}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500">
                        <RiCloseLine className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Loading...</div>
                    ) : items.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">Cart is empty</div>
                    ) : (
                        <ul className="space-y-3">
                            {items.map((item, i) => (
                                <li key={item.productId?._id || i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    {item.productId?.thumbnail?.url && (
                                        <Image
                                            src={item.productId.thumbnail.url}
                                            alt={item.productId.title || ''}
                                            width={64}
                                            height={64}
                                            className="w-16 h-16 rounded-lg object-cover bg-white border border-gray-200 flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="text-sm font-medium text-gray-900 line-clamp-2"
                                            dangerouslySetInnerHTML={{ __html: item.productId?.title || 'Unknown product' }}
                                        />

                                        {/* Variant info */}
                                        {(item.size || item.color) && (
                                            <div className="flex gap-2 mt-1">
                                                {item.size && (
                                                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                                        Size: {item.size}
                                                    </span>
                                                )}
                                                {item.color && (
                                                    <span className="text-[10px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded">
                                                        Color: {item.color}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-1.5">
                                            <p className="text-sm">
                                                <span className="font-bold text-purple-600">{formatCurrency(item.price)}</span>
                                                <span className="text-xs text-gray-500 ml-1">× {item.quantity}</span>
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {formatCurrency((item.price || 0) * (item.quantity || 0))}
                                            </p>
                                        </div>

                                        {/* Custom data badge */}
                                        {item.custom_data && Object.keys(item.custom_data).length > 0 && (
                                            <span className="inline-block mt-1 text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                                                Customized
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">
                        Grand Total: <span className="text-green-700">{formatCurrency(grandTotal)}</span>
                    </span>
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