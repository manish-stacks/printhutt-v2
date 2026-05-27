"use client"

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaCheck, FaDownload, FaEdit, FaMapMarked, FaSearch, FaStar, FaStarHalfAlt, FaTrashAlt } from 'react-icons/fa';
import { RiLoader2Line, RiMessageFill } from 'react-icons/ri';
import Link from 'next/link';
import { Pagination } from '@/components/admin/Pagination';
import { IOrder } from '@/lib/types/order';
import { get_all_orders_of_user } from '@/_services/common/order';
import { toast } from 'react-toastify';
import { formatCurrency } from '@/helpers/helpers';
import { axiosInstance } from '@/utils/axios';
import confetti from 'canvas-confetti';


export default function OrderPage() {
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [pagination, setPagination] = useState(null);
    const [revenue, setRevenue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);  // Add this line
    const router = useRouter();
    const page = searchParams?.get('page') || '1';
    const search = searchParams?.get('search') || '';
    const status = searchParams?.get('status') || '';
    const [isDeletingModal, setIsDeleteModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sendMessageModal, setIsSendMessageModal] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const startDate = searchParams?.get('startDate') || '';
    const endDate = searchParams?.get('endDate') || '';
    const filterStatus = searchParams?.get('status') || '';

    // const fetchOrders = useCallback(async () => {
    //     try {
    //         setIsLoading(true);
    //         const data = await get_all_orders_of_user(page, search, status);
    //         setOrders(data.orders);
    //         setPagination(data.pagination);
    //     } catch (error) {
    //         console.error('Failed to fetch orders:', error);
    //         toast.error('Failed to fetch orders');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // }, [page, search, status]);

    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await get_all_orders_of_user(
                page,
                search,
                filterStatus,
                startDate,
                endDate
            );
            // console.log('pagination', data.pagination)
            setOrders(data.orders);
            setPagination(data.pagination);
            setRevenue(data.revenue);
        } catch (error) {
            toast.error('Failed to fetch orders');
        } finally {
            setIsLoading(false);
        }
    }, [page, search, filterStatus, startDate, endDate]);




    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSearch = (value: string) => {
        const params = new URLSearchParams(searchParams!);
        if (value) {
            params.set('search', value);
        } else {
            params.delete('search');
        }
        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams!);
        params.set('page', newPage.toString());
        router.push(`?${params.toString()}`);
    };



    const OrderStatus = ({ order }: { order: IOrder }) => {
        if (!order) return null;

        switch (order.status) {
            case "pending":
                return <span className="bg-yellow-200 text-yellow-800 px-2 rounded-full">{order.status}</span>;
            case "confirmed":
                return <span className="bg-green-200 text-green-800 px-2 rounded-full">{order.status}</span>;
            case "cancelled":
                return <span className="bg-red-200 text-red-800 px-2 rounded-full">{order.status}</span>;
            case "delivered":
                return <span className="bg-green-950 text-white px-2 rounded-full">{order.status}</span>;
            default:
                return <span className="bg-blue-200 text-blue-800 px-2 rounded-full">{order.status}</span>;
        }
    };


    const sendMessageHandler = async () => {
        try {
            if (isSubmitting) return; // Prevent double submission
            if (!message.trim()) {
                toast.error('Please enter a message');
                return;
            }

            setIsSubmitting(true);
            const response = await axiosInstance.post('/orders/send-message', {
                orderId,
                message: message.trim()
            });

            if (!response || (response as { success?: boolean })?.success === false) {
                throw new Error('Failed to send message');
            }

            toast.success('Message sent successfully');
            setMessage('');
            setIsSendMessageModal(false);
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setIsSubmitting(false);
        }
    }

    const sendMessage = async (orderID: string) => {
        if (!orderID) {
            toast.error('Order ID is required');
            return;
        }
        setOrderId(orderID);
        setMessage(''); // Clear any previous message
        setIsSendMessageModal(true);
    }



    const handleDelete = async (id: string) => {
        // console.log(id)
        setDeletingId(id);
        setIsDeleteModal(true);
    }

    const deleteOrderHandler = async () => {
        try {
            if (!deletingId) return;
            setIsDeleting(true);
            await axiosInstance.delete(`/orders/${deletingId}`);
            toast.success('Order deleted successfully');
            fetchOrders();
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
            setIsDeleteModal(false);
        }
    }

    const handleStatusChange = async (id: string, status: string) => {
        try {
            const response = await axiosInstance.patch(`/orders/${id}/status`, {
                status: status,
            });
            if (!response || (response as { success?: boolean })?.success === false) {
                throw new Error('Failed to update order status');
            }
            toast.success('Order status updated successfully');
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    }

    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams!);

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        params.set('page', '1');
        router.push(`?${params.toString()}`);
    };


    const copyLink = (path: string) => {
        if (typeof window === "undefined") return;

        const fullUrl = window.location.origin + path;
        navigator.clipboard.writeText(fullUrl);
        toast.success('Link copied to clipboard');
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
        });
    };

    return (
        <>
            <div className="max-w-10xl mx-auto lg:px-10 py-20">
                <div className="w-full md:w-12/12 lg:w-12/12 mb-5">
                    <div className="bg-white text-black flex justify-between align-middle p-6 rounded-lg shadow-md">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
                            <p className="text-gray-600">Manage orders and shipping </p>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Total revenue</h2>
                            <p className="text-gray-600"> {formatCurrency(revenue)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white px-5 py-10">
                    <div className="mb-6 flex justify-between items-center">

                        <div className="relative hidden sm:block mt-4">
                            <FaSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search orders..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-80 rounded-lg border border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>


                        <div className="mb-6 flex flex-wrap gap-4 items-end">

                            {/* Start Date */}
                            <div>
                                <label className="text-sm text-gray-600">From Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => updateFilters('startDate', e.target.value)}
                                    className="border rounded px-3 py-2"
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="text-sm text-gray-600">To Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => updateFilters('endDate', e.target.value)}
                                    className="border rounded px-3 py-2"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="text-sm text-gray-600">Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => updateFilters('status', e.target.value)}
                                    className="border rounded px-3 py-2"
                                >
                                    <option value="all">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                        </div>

                    </div>

                    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <RiLoader2Line className="h-8 w-8 text-blue-500 animate-spin" />
                            </div>
                        ) : (
                            <table className="min-w-full table-auto text-left text-sm text-gray-600">
                                <thead>
                                    <tr className="bg-gray-100 border-b">
                                        <th className="py-3 px-4">Order ID</th>
                                        <th className="py-3 px-4">Placed On</th>
                                        <th className="py-3 px-4">Pay Amount</th>
                                        <th className="py-3 px-4">Items</th>
                                        <th className="py-3 px-4">Mode</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-3 px-4 text-center">
                                                No orders found.
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order, index) => (
                                            <tr key={index} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 text-amber-600">
                                                    <Link
                                                        href={`/admin/orders/orders-details/${order._id}`}>{order.orderId}
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}

                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-green-500">₹{order.payAmt}</span>&nbsp;
                                                    <span className="text-rose-600">
                                                        {order.paymentType !== "online" && ', ' + (order?.totalAmount?.discountPrice - order?.payAmt)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 space-y-2">
                                                    {order.items.map((item, i) => {
                                                        const rating = item?.review?.rating || 0;

                                                        return (
                                                            <div key={i} className="flex flex-col gap-1">
                                                                {/* Product name */}
                                                                <span className="text-gray-700">
                                                                    <a
                                                                        target="_blank"
                                                                        href={`/product-details/${item.slug}`}
                                                                        className="hover:underline"
                                                                    >
                                                                        {i + 1}. {item.name}
                                                                    </a>
                                                                </span>

                                                                {/* ⭐ Rating / Review */}
                                                                {order.status === "delivered" && (
                                                                    item.review ? (
                                                                        /* ================= ALREADY REVIEWED ================= */
                                                                        <div className="flex items-center gap-1">
                                                                            {[1, 2, 3, 4, 5].map((star) => {
                                                                                if (rating >= star) {
                                                                                    return (
                                                                                        <FaStar
                                                                                            key={star}
                                                                                            className="text-yellow-400"
                                                                                        />
                                                                                    );
                                                                                } else if (rating >= star - 0.5) {
                                                                                    return (
                                                                                        <FaStarHalfAlt
                                                                                            key={star}
                                                                                            className="text-yellow-400"
                                                                                        />
                                                                                    );
                                                                                } else {
                                                                                    return (
                                                                                        <FaStar
                                                                                            key={star}
                                                                                            className="text-gray-300"
                                                                                        />
                                                                                    );
                                                                                }
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        /* ================= NOT REVIEWED ================= */
                                                                        <a
                                                                            onClick={() =>
                                                                                copyLink(`/product-details/${item.slug}/write-review`)
                                                                            }
                                                                            className="flex items-center gap-1 text-gray-400 hover:text-yellow-500 cursor-pointer"
                                                                            title="Copy Review Link"
                                                                        >
                                                                            {[1, 2, 3, 4, 5].map((_, idx) => (
                                                                                <FaStar key={idx} />
                                                                            ))}
                                                                            <span className="ml-2 text-xs underline">
                                                                                Copy Link
                                                                            </span>
                                                                        </a>
                                                                    )
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </td>

                                                <td className="py-3 px-4">
                                                    {
                                                        order?.paymentType && order?.paymentType == 'online' ? (
                                                            <span className="bg-green-200 text-green-800 px-2 rounded-full">Online</span>
                                                        ) : (
                                                            <span className="bg-slate-200 text-slate-800 px-2 rounded-full">COD</span>
                                                        )
                                                    }

                                                </td>
                                                <td className="py-3 px-4">
                                                    {
                                                        OrderStatus({ order })
                                                    }
                                                </td>
                                                <td className="py-3 px-4 flex space-x-2">
                                                    {
                                                        order.status == 'shipped' && (
                                                            <>
                                                                <button
                                                                    title="Mark As Delivered"
                                                                    onClick={() => handleStatusChange(order._id, 'delivered')}
                                                                    className="text-purple-200 bg-purple-800 p-2 rounded-full"
                                                                >
                                                                    <FaCheck />
                                                                </button>
                                                                <a
                                                                    title="Track Order"
                                                                    href={`https://app.fship.in/shipment/tracking?awbno=${order.shipment.trackingId}`}
                                                                    target="_blank"
                                                                    className="text-orange-100 bg-orange-800 p-2 rounded-full"
                                                                >
                                                                    <FaMapMarked />
                                                                </a>
                                                                <span className=" border-l-2 border-l-gray-400"></span>

                                                            </>
                                                        )
                                                    }
                                                    <Link
                                                        title="Edit Order"
                                                        href={order.status == 'pending' ? `/admin/orders/pending-order/${order._id}` : `/admin/orders/orders-details/${order._id}`}
                                                        className="text-green-800 bg-green-300 p-2 rounded-full"
                                                    >
                                                        <FaEdit />
                                                    </Link>
                                                    <Link
                                                        title="Invoice"
                                                        target="_blank"
                                                        href={`/orders/${order._id}/billing`}
                                                        className="text-blue-800 bg-blue-300 p-2 rounded-full"
                                                    >
                                                        <FaDownload />
                                                    </Link>
                                                    <button
                                                        title="Message Customer"
                                                        onClick={() => sendMessage(order._id)}
                                                        className="text-amber-800 bg-amber-300 p-2 rounded-full"
                                                    >
                                                        <RiMessageFill />
                                                    </button>
                                                    {
                                                        (order.status == 'pending' || order.status == 'cancelled' ) &&(
                                                            <>

                                                                <button
                                                                    title="Delete Order"
                                                                    onClick={() => handleDelete(order._id)}
                                                                    className="text-red-800 bg-red-300 p-2 rounded-full"
                                                                >
                                                                    <FaTrashAlt />
                                                                </button>
                                                            </>
                                                        )
                                                    }
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {pagination && (
                        <Pagination pagination={pagination} onPageChange={handlePageChange} />
                    )}
                </div>
            </div>

            {
                sendMessageModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/3 lg:w-1/3">
                            <h2 className="text-xl font-bold mb-4">Send Message</h2>

                            <div className="flex justify-center mt-4 w-full p-4">
                                <form className="space-y-4 w-full" onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessageHandler();
                                }}>
                                    <textarea
                                        className="border border-gray-300 rounded-lg p-2 w-full"
                                        placeholder="Type your message here..."
                                        rows={4}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        maxLength={200}
                                    ></textarea>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-gray-500 text-sm">Max 200 characters</span>

                                    </div>
                                    <input type="hidden" name="orderId" value={orderId} />
                                    <div className='flex justify-end'>
                                        <button
                                            onClick={() => setIsSendMessageModal(false)}
                                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => sendMessageHandler()}
                                            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <RiLoader2Line className="animate-spin mr-2" />
                                                    Sending...
                                                </>
                                            ) : (
                                                'Send'
                                            )}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                isDeletingModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/3 lg:w-1/3">
                            <h2 className="text-xl font-bold text-red-600 mb-4">Delete Order</h2>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete this order? This action cannot be undone.
                            </p>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsDeleteModal(false)}
                                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded mr-2"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => deleteOrderHandler()}
                                    className="bg-red-600 text-white px-4 py-2 rounded flex items-center"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <RiLoader2Line className="animate-spin mr-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }




        </>
    );
}


