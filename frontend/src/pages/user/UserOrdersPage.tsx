"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import UserSidebar from "@/components/user/user-sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Pagination } from "@/components/admin/Pagination";
import { IOrder } from "@/lib/types/order";
import { get_all_orders_of_user } from "@/_services/common/order";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency } from "@/helpers/helpers";
import {
  RiSearchLine, RiEyeLine, RiDownload2Line, RiTruckLine,
  RiStarFill, RiStarLine, RiShoppingBag2Line,
} from "react-icons/ri";
import { FaMapMarked } from "react-icons/fa";

const STATUS_STYLE: Record<string, string> = {
  delivered: 'bg-green-100 text-green-700',
  shipped: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-purple-100 text-[#3C2A6D]',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
};

const UserOrdersPage = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [pagination, setPagination] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get('page') || '1';
  const search = searchParams?.get('search') || '';

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const data: any = await get_all_orders_of_user(page, search, '');
        setOrders(data.orders);
        setPagination(data.pagination);
      } catch (e) { toast.error('Failed to fetch orders'); }
      finally { setIsLoading(false); }
    })();
  }, [page, search]);

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams!);
    value ? params.set('search', value) : params.delete('search');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (p: number) => {
    const params = new URLSearchParams(searchParams!);
    params.set('page', p.toString());
    router.push(`?${params.toString()}`);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <>
      {/* <Breadcrumb title="Orders" /> */}
      <section className="py-6 sm:py-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">

          <div className="lg:w-[280px] flex-shrink-0">
            <UserSidebar activemenu="orders" />
          </div>

          <div className="flex-1 space-y-5 min-w-0">

            {/* Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#3C2A6D] via-[#3C2A6D] to-[#593f9e] text-white rounded-2xl p-6 sm:p-8 shadow-md">
              <div className="relative z-10">
                <p className="text-purple-100 text-sm">Order History</p>
                <h2 className="text-2xl sm:text-3xl font-bold mt-1">
                  {pagination?.total || 0} Total Orders
                </h2>
                <p className="text-purple-100 text-sm mt-2">
                  Track and manage all your purchases
                </p>
              </div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -right-20 -bottom-10 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl" />
            </div>

            {/* Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="search"
                  placeholder="Search by order ID or product..."
                  defaultValue={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Orders */}
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                <RiShoppingBag2Line className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No orders found</p>
                <Link
                  href="/products"
                  className="mt-4 inline-flex items-center gap-2 bg-[#3C2A6D] hover:bg-[#3C2A6D] text-white px-5 py-2 rounded-xl text-sm font-medium"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <p className="text-xs text-gray-500">Order ID</p>
                          <p className="font-semibold text-gray-900 text-sm">{order.orderId}</p>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-gray-200" />
                        <div>
                          <p className="text-xs text-gray-500">Placed On</p>
                          <p className="text-sm text-gray-700">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="hidden sm:block w-px h-8 bg-gray-200" />
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {formatCurrency(order.totalAmount.discountPrice)}
                          </p>
                        </div>
                      </div>

                      <span className={`text-xs font-semibold px-3 py-1.5 rounded-full capitalize ${STATUS_STYLE[order.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="p-4 sm:p-5">
                      <div className="space-y-3">
                        {order.items.map((item: any, i: number) => {
                          const rating = item?.review?.rating || 0;
                          return (
                            <div key={i} className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="flex-1 min-w-0">
                                <a
                                  href={`/product-details/${item.slug}`}
                                  target="_blank"
                                  className="text-sm text-gray-800 hover:text-[#3C2A6D] font-medium break-words"
                                >
                                  {item.name}
                                </a>
                                {order.status === 'delivered' && (
                                  item.review ? (
                                    <div className="flex gap-0.5 mt-1">
                                      {[1, 2, 3, 4, 5].map((s) =>
                                        rating >= s ? (
                                          <RiStarFill key={s} className="text-yellow-400 w-3.5 h-3.5" />
                                        ) : (
                                          <RiStarLine key={s} className="text-gray-300 w-3.5 h-3.5" />
                                        )
                                      )}
                                    </div>
                                  ) : (
                                    <Link
                                      href={`/product-details/${item.slug}/write-review`}
                                      className="text-xs text-[#3C2A6D] hover:underline mt-1 inline-block"
                                    >
                                      ✍️ Write a review
                                    </Link>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                      <Link
                        href={`/orders/${order._id}`}
                        className="flex items-center gap-1.5 text-xs font-medium bg-white text-[#3C2A6D] hover:bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg transition"
                      >
                        <RiEyeLine /> View Details
                      </Link>
                      <Link
                        href={`/orders/${order._id}/billing`}
                        target="_blank"
                        className="flex items-center gap-1.5 text-xs font-medium bg-white text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg transition"
                      >
                        <RiDownload2Line /> Invoice
                      </Link>

                      {order.status === 'shipped' && (() => {
                        const trackingUrls = {
                          fship: `https://app.fship.in/shipment/tracking?awbno=${order.shipment.trackingId}`,
                          velocity: `https://www.velocityshipping.in/track/${order.shipment.trackingId}`,
                          shiprocket: `/user/order-track/${order?.shipment?.trackingId}`,
                        };

                        return (
                          <a
                            title="Track Order"
                            href={trackingUrls[order.shipment.provider] || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-medium bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                          >
                            <FaMapMarked /> Track Order
                          </a>
                        );
                      })()}

                    </div>
                  </div>
                ))}
              </div>
            )}

            {pagination && pagination.pages > 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <Pagination pagination={pagination} onPageChange={handlePageChange} />
              </div>
            )}

          </div>
        </div>
      </section>
    </>
  );
};

export default UserOrdersPage;