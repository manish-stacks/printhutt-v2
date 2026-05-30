"use client";
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  RiArrowLeftLine, RiTimeLine, RiCheckLine, RiTruckLine,
  RiBoxingLine, RiCloseLine, RiMoneyDollarCircleLine,
  RiMapPin2Line, RiPhoneLine, RiCheckboxCircleFill,
  RiCloseCircleFill, RiInformationLine, RiUser3Line,
  RiBankCard2Line,
} from 'react-icons/ri';
import { formatCurrency, formatDate } from '@/helpers/helpers';
import { useEffect, useState } from 'react';
import { IOrder } from '@/lib/types/order';
import { get_order_by_id } from '@/_services/common/order';
import { toast } from 'react-toastify';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';
import CustomizeOderModel from '@/components/admin/order/CustomizeOderModel';

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  pending:   { icon: RiTimeLine,        color: 'text-amber-700',   bg: 'bg-amber-100' },
  confirmed: { icon: RiCheckLine,       color: 'text-blue-700',    bg: 'bg-blue-100' },
  shipped:   { icon: RiTruckLine,       color: 'text-purple-700',  bg: 'bg-purple-100' },
  delivered: { icon: RiBoxingLine,      color: 'text-green-700',   bg: 'bg-green-100' },
  cancelled: { icon: RiCloseLine,       color: 'text-red-700',     bg: 'bg-red-100' },
  refunded:  { icon: RiCloseLine,       color: 'text-orange-700',  bg: 'bg-orange-100' },
};

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [order, setOrder] = useState<IOrder | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await get_order_by_id(id as string);
        setOrder(res.data);
      } catch (e) {
        console.error(e);
        toast.error('Error fetching order');
      }
    })();
  }, [id]);

  if (!order) return <LoadingSpinner />;

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusInfo.icon;

  /* Calculations */
  const subtotal = order.totalAmount.totalPrice;
  const shipping = order.totalAmount.shippingTotal;
  const couponDiscount = order.coupon.isApplied ? order.totalAmount.coupon_discount : 0;
  const extraDiscount = (subtotal + shipping) - (order.totalAmount.discountPrice + shipping);
  const finalTotal = (order.totalAmount.discountPrice + shipping) - couponDiscount;
  const dueAmount = order.paymentType === 'offline' ? finalTotal - order.payAmt : 0;

  return (
    <section className="py-6 sm:py-8 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl space-y-5">

        {/* Back link */}
        <Link
          href="/user/orders"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-purple-600 transition"
        >
          <RiArrowLeftLine className="w-4 h-4" /> Back to Orders
        </Link>

        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 text-white rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-purple-100 text-sm">Order Details</p>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1">#{order.orderId}</h2>
              <p className="text-purple-100 text-sm mt-2">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur ${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-semibold capitalize">{order.status}</span>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -right-20 -bottom-10 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl" />
        </div>

        {/* GRID — left items, right details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT — items + payment summary (span 2) */}
          <div className="lg:col-span-2 space-y-5">

            {/* Order items */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Items <span className="text-sm font-normal text-gray-500">({order.items.length})</span>
              </h3>

              <div className="space-y-4">
                {order.items.map((item, i) => (
                  <div key={i} className={`pb-4 ${i < order.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div className="flex items-start gap-4">
                      <Image
                        alt={item.name}
                        src={item.product_image || 'https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/placeholder-image_wps86z_qulbgy.webp'}
                        width={70}
                        height={70}
                        className="rounded-xl object-cover bg-gray-50 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product-details/${item.slug}`}
                          className="text-sm font-medium text-gray-900 hover:text-purple-600 transition break-words"
                        >
                          {item.name}
                        </Link>
                        <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1.5">
                          <span>Qty: <strong className="text-gray-700">{item.quantity}</strong></span>
                          {item.sku && <span>SKU: <strong className="text-gray-700">{item.sku}</strong></span>}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    {item?.custom_data && (
                      <div className="mt-3 ml-[86px]">
                        <CustomizeOderModel item={item?.custom_data} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <RiMoneyDollarCircleLine className="w-5 h-5 text-purple-600" />
                Payment Summary
              </h3>

              <div className="space-y-2.5 text-sm">
                <Row label="Subtotal" value={formatCurrency(subtotal)} />
                <Row
                  label="Shipping"
                  value={shipping > 0 ? formatCurrency(shipping) : <span className="text-green-600 font-medium">Free</span>}
                />
                {order.coupon.isApplied && (
                  <Row
                    label={`Coupon (${order.coupon.code})`}
                    value={<span className="text-red-600">- {formatCurrency(couponDiscount)}</span>}
                  />
                )}
                {extraDiscount > 0 && (
                  <Row
                    label="Extra Discount"
                    value={<span className="text-red-600">- {formatCurrency(extraDiscount)}</span>}
                  />
                )}

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-purple-600">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                {order.paymentType === 'offline' && (
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-200 space-y-2">
                    <Row
                      label="Amount Paid"
                      value={<span className="text-green-600 font-medium">- {formatCurrency(order.payAmt)}</span>}
                    />
                    <Row
                      label="Due on Delivery"
                      value={<span className="text-rose-600 font-semibold">{formatCurrency(dueAmount)}</span>}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Payment + Shipping */}
          <div className="space-y-5">

            {/* Payment details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <RiBankCard2Line className="w-5 h-5 text-purple-600" />
                Payment
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Method</span>
                  <span className="capitalize font-medium text-gray-900">{order.payment.method}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status</span>
                  {order.payment.isPaid ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium">
                      <RiCheckboxCircleFill /> Paid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-500 font-medium">
                      <RiCloseCircleFill /> Unpaid
                    </span>
                  )}
                </div>

                {order.payment.transactionId && (
                  <div>
                    <p className="text-gray-500 text-xs">Transaction ID</p>
                    <p className="font-mono text-xs text-gray-800 break-all mt-0.5">
                      {order.payment.transactionId}
                    </p>
                  </div>
                )}

                {order.payment.paidAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Paid At</span>
                    <span className="text-gray-900 text-xs">{formatDate(order.payment.paidAt)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Pay Amount</span>
                  <span className="font-bold text-gray-900">{formatCurrency(order.payAmt)}</span>
                </div>
              </div>
            </div>

            {/* Shipping address */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <RiMapPin2Line className="w-5 h-5 text-purple-600" />
                Delivery Address
              </h3>

              <div className="text-sm space-y-2.5">
                <div className="flex items-start gap-2">
                  <RiUser3Line className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="font-medium text-gray-900">{order.shipping.userName || 'Guest'}</p>
                </div>

                <div className="flex items-start gap-2">
                  <RiMapPin2Line className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 leading-relaxed">
                    {order.shipping.addressLine}<br />
                    {order.shipping.city}, {order.shipping.state} {order.shipping.postCode}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <RiPhoneLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-gray-700">{order.shipping.mobileNumber}</p>
                </div>
              </div>

              {/* Track button if shipped */}
              {order?.shipment?.trackingId && (
                <Link
                  href={`/user/order-track/${order.shipment.trackingId}`}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-medium transition"
                >
                  <RiTruckLine /> Track Shipment
                </Link>
              )}
            </div>

            {/* Help / Invoice */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-5">
              <RiInformationLine className="w-5 h-5 text-purple-600 mb-2" />
              <h4 className="font-semibold text-gray-900 text-sm">Need an invoice?</h4>
              <p className="text-xs text-gray-600 mt-1">Download a copy of your tax invoice</p>
              <Link
                href={`/orders/${order._id}/billing`}
                target="_blank"
                className="mt-3 inline-block text-sm text-purple-600 hover:text-purple-700 font-semibold"
              >
                Download Invoice →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="text-gray-900">{value}</span>
  </div>
);