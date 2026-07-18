'use client';

/**
 * Orders → Excel export modal.
 *
 * Self-contained: apna filter state khud rakhta hai, page ke URL filters ko
 * chhedta nahi. Sirf `isOpen` / `onClose` chahiye. Optional `defaults` se
 * page ke current filters prefill ho jaate hain.
 */
import { useEffect, useState } from 'react';
import { FaFileExcel, FaTimes } from 'react-icons/fa';
import { RiLoader2Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { export_orders_excel } from '@/_services/common/order';

type PaymentType = 'all' | 'online' | 'offline';
type PaymentStatus = 'all' | 'paid' | 'unpaid';

interface ExportOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaults?: {
        search?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    };
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'All (pending chhod ke)' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'progress', label: 'Progress' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'returned', label: 'Returned' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'cancelled,refunded,returned', label: 'Cancelled + Refunded + Returned' },
    { value: 'pending', label: 'Pending' },
];

export default function ExportOrdersModal({
    isOpen,
    onClose,
    defaults,
}: ExportOrdersModalProps) {
    const [status, setStatus] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentType, setPaymentType] = useState<PaymentType>('all');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('all');
    const [search, setSearch] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    /* Modal khulte hi page ke current filters prefill kar do */
    useEffect(() => {
        if (!isOpen) return;
        setStatus(defaults?.status || 'all');
        setStartDate(defaults?.startDate || '');
        setEndDate(defaults?.endDate || '');
        setSearch(defaults?.search || '');
        setPaymentType('all');
        setPaymentStatus('all');
    }, [isOpen, defaults?.status, defaults?.startDate, defaults?.endDate, defaults?.search]);

    /* Esc se band */
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isExporting) onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, isExporting, onClose]);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (startDate && endDate && startDate > endDate) {
            toast.error('From Date, To Date se badi nahi ho sakti');
            return;
        }
        try {
            setIsExporting(true);
            const blob = (await export_orders_excel({
                search,
                status,
                startDate,
                endDate,
                paymentType,
                paymentStatus,
            })) as unknown as Blob;

            if (!blob || blob.size === 0) {
                toast.error('No data to export');
                return;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders-${status.replace(/,/g, '-')}-${new Date()
                .toISOString()
                .slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Export downloaded');
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const resetFilters = () => {
        setStatus('all');
        setStartDate('');
        setEndDate('');
        setPaymentType('all');
        setPaymentStatus('all');
        setSearch('');
    };

    const inputCls =
        'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
    const labelCls = 'block text-sm text-gray-600 mb-1';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FaFileExcel className="text-emerald-600" /> Export Orders
                        </h2>
                        <p className="text-sm text-gray-500">Filter lagao aur Excel download karo</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isExporting}
                        className="text-gray-400 hover:text-gray-700 disabled:opacity-50"
                        title="Close"
                    >
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="sm:col-span-2">
                        <label className={labelCls}>Order Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className={inputCls}
                        >
                            {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>Payment Status</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                            className={inputCls}
                        >
                            <option value="all">All</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid / COD Pending</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>Payment Mode</label>
                        <select
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                            className={inputCls}
                        >
                            <option value="all">All</option>
                            <option value="online">Online</option>
                            <option value="offline">COD</option>
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>From Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>To Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className={inputCls}
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className={labelCls}>Order ID (optional)</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Partial order id..."
                            className={inputCls}
                        />
                    </div>

                    <p className="sm:col-span-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                        Sheet me: Order ID, status, Paid/COD, email, phone (+91), purchase date,
                        order value, city/state + summary sheet. Date blank chhoda to poora data aayega.
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 rounded-b-lg">
                    <button
                        onClick={resetFilters}
                        disabled={isExporting}
                        className="text-sm text-gray-600 hover:text-gray-900 underline disabled:opacity-50"
                    >
                        Reset filters
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            disabled={isExporting}
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isExporting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-60"
                        >
                            {isExporting ? (
                                <>
                                    <RiLoader2Line className="animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FaFileExcel />
                                    Download Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}