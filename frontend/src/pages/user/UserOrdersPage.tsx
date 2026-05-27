"use client";
import React, { useEffect, useState } from "react";
import Breadcrumb from "@/components/Breadcrumb";
import UserSidebar from "@/components/user/user-sidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { Pagination } from "@/components/admin/Pagination";
import { RiLoader2Line } from "react-icons/ri";
import { IOrder } from "@/lib/types/order";
import { get_all_orders_of_user } from "@/_services/common/order";
import { FaDownload, FaEye, FaSearch, FaStar, FaStarHalfAlt } from "react-icons/fa";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency } from "@/helpers/helpers";

const UserOrdersPage = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [pagination, setPagination] = useState()
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = searchParams?.get('page') || '1';
  const search = searchParams?.get('search') || '';

  async function fetchOrders() {
    try {
      setIsLoading(true);
      const data = await get_all_orders_of_user(page, search, '')
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to fetch return methods:', error);
      toast.error('Failed to fetch return methods');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [page, search]);

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


  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>

      <Breadcrumb title={"Orders"} />
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <div className="w-full lg:w-1/4">
            <UserSidebar activemenu={'orders'} />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6">

            {/* Header */}
            <div className="bg-purple-600 text-white rounded-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold">
                Order History
              </h2>
            </div>

            {/* Main Card */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">

              {/* Search */}
              <div className="mb-4 flex flex-col sm:flex-row justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    placeholder="Search orders..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="w-full overflow-x-auto rounded-lg border">
                <table className="min-w-[800px] w-full text-sm text-gray-600">

                  {/* Head */}
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="py-3 px-4 text-left">Order ID</th>
                      <th className="py-3 px-4 text-left">Placed On</th>
                      <th className="py-3 px-4 text-left">Amount</th>
                      <th className="py-3 px-4 text-left">Items</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-500">
                          No orders found 😕
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50 transition">

                          {/* Order ID */}
                          <td className="py-3 px-4 text-amber-600">
                            <Link href={`/orders/${order._id}`}>
                              {order.orderId}
                            </Link>

                            {order?.shipment?.trackingId && (
                              <div>
                                <Link
                                  href={`/user/order-track/${order.shipment.trackingId}`}
                                  className="text-blue-600 underline text-xs"
                                >
                                  Track Order
                                </Link>
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4">
                            {new Date(order.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Amount */}
                          <td className="py-3 px-4 font-medium">
                            {formatCurrency(order.totalAmount.discountPrice)}
                          </td>

                          {/* Items */}
                          <td className="py-3 px-4 space-y-2 max-w-[250px]">
                            {order.items.map((item, i) => {
                              const rating = item?.review?.rating || 0;

                              return (
                                <div key={i} className="flex flex-col gap-1">
                                  <span className="text-gray-700 break-words">
                                    {i + 1}.{" "}
                                    <a
                                      href={`/product-details/${item.slug}`}
                                      target="_blank"
                                      className="hover:underline"
                                    >
                                      {item.name}
                                    </a>
                                  </span>

                                  {/* Rating */}
                                  {order.status === "delivered" && (
                                    item.review ? (
                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) =>
                                          rating >= star ? (
                                            <FaStar key={star} className="text-yellow-400" />
                                          ) : (
                                            <FaStar key={star} className="text-gray-300" />
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <Link
                                        href={`/product-details/${item.slug}/write-review`}
                                        className="text-xs text-gray-400 underline"
                                      >
                                        Write Review
                                      </Link>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 capitalize">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${order.status === "delivered"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {order.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap justify-center gap-2">
                              <Link
                                href={`/orders/${order._id}`}
                                className="text-blue-700 p-2 bg-blue-100 rounded-full"
                              >
                                <FaEye />
                              </Link>

                              <Link
                                href={`/orders/${order._id}/billing`}
                                target="_blank"
                                className="text-rose-700 p-2 bg-rose-100 rounded-full"
                              >
                                <FaDownload />
                              </Link>
                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="mt-6">
                  <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}

            </div>
          </div>
        </div>
      </section>
    </>

  );
};

export default UserOrdersPage; 
