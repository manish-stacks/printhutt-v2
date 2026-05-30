"use client";
import { notFound, useParams } from 'next/navigation';
import { formatCurrency, formatDate } from '@/helpers/helpers';
import { useEffect, useState } from 'react';
import { IOrder } from '@/lib/types/order';
import { get_order_details } from '@/_services/common/order';
import { usePDF } from 'react-to-pdf';
import {
  RiDownload2Line, RiUser3Line, RiMapPin2Line,
  RiPhoneLine, RiFileList3Line, RiInformationLine,
} from 'react-icons/ri';

export default function InvoicePage() {
  const params = useParams();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const { toPDF, targetRef } = usePDF({ filename: `invoice_${order?.orderId || 'order'}.pdf` });

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      try {
        const data: any = await get_order_details(params.id);
        setOrder(data.data);
      } catch (e) {
        console.error(e);
        notFound();
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  /* Auto-download then close */
//   useEffect(() => {
//     if (!loading && order) {
//       const t = setTimeout(async () => {
//         await toPDF();
//         window.close();
//       }, 800);
//       return () => clearTimeout(t);
//     }
//   }, [loading, order, toPDF]);

  /* GST helpers */
  const calculateGST = (amount: number, gstRate = 18) => {
    const baseAmount = amount / (1 + gstRate / 100);
    return { baseAmount, gstAmount: amount - baseAmount, gstRate };
  };

  const getGSTBreakdown = () => {
    if (!order) return null;
    const subtotal = order.totalAmount.totalPrice;
    const shipping = order.totalAmount.shippingTotal;
    const couponDiscount = order.totalAmount.coupon_discount || 0;
    const extraDiscount = (subtotal + shipping) - (order.totalAmount.discountPrice + shipping);
    const discountedSubtotal = order.totalAmount.discountPrice;
    const gstOnItems = calculateGST(discountedSubtotal, 18);
    const gstOnShipping = shipping > 0 ? calculateGST(shipping, 5) : null;
    const totalBeforeGST = gstOnItems.baseAmount + (gstOnShipping?.baseAmount || 0);
    const totalGST = gstOnItems.gstAmount + (gstOnShipping?.gstAmount || 0);
    const finalAmount = (discountedSubtotal + shipping) - couponDiscount;
    return { subtotal, shipping, couponDiscount, extraDiscount, discountedSubtotal, gstOnItems, gstOnShipping, totalBeforeGST, totalGST, finalAmount };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!order) return notFound();
  const gst = getGSTBreakdown();

  return (
    <div className="min-h-screen bg-gray-100 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto px-4">

        {/* Action buttons (hidden on print) */}
        <div className="flex justify-end gap-3 mb-5 print:hidden">
          <button
            onClick={() => toPDF()}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <RiDownload2Line className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        {/* Invoice */}
        <div ref={targetRef} className="bg-white shadow-lg rounded-2xl overflow-hidden">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 sm:px-10 py-7 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">INVOICE</h1>
                <p className="text-purple-100 mt-1 text-sm">Invoice No: #{order.orderId}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-purple-100 text-sm">Date: {formatDate(order.createdAt)}</p>
                <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  order.payment.isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.paymentType === 'offline' ? 'Post-Paid (COD)' : 'Pre-Paid'}
                </span>
              </div>
            </div>
          </div>

          {/* BODY */}
          <div className="p-6 sm:p-10">

            {/* Billing & Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              <InfoBlock title="Billed To" icon={RiUser3Line}>
                <p className="font-semibold text-gray-900">{order.shipping.userName || 'Guest'}</p>
                <p className="flex items-start gap-1.5 mt-1">
                  <RiMapPin2Line className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span>
                    {order.shipping.addressLine}<br />
                    {order.shipping.city}, {order.shipping.state} {order.shipping.postCode}
                  </span>
                </p>
                <p className="flex items-center gap-1.5 mt-1">
                  <RiPhoneLine className="w-4 h-4 text-gray-400" />
                  {order.shipping.mobileNumber}
                </p>
              </InfoBlock>

              <InfoBlock title="Shipped To" icon={RiMapPin2Line}>
                <p className="font-semibold text-gray-900">{order.shipping.userName || 'Guest'}</p>
                <p className="flex items-start gap-1.5 mt-1">
                  <RiMapPin2Line className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span>
                    {order.shipping.addressLine}<br />
                    {order.shipping.city}, {order.shipping.state} {order.shipping.postCode}
                  </span>
                </p>
                <p className="flex items-center gap-1.5 mt-1">
                  <RiPhoneLine className="w-4 h-4 text-gray-400" />
                  {order.shipping.mobileNumber}
                </p>
              </InfoBlock>
            </div>

            {/* Items table */}
            <div className="mb-8">
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <RiFileList3Line className="w-5 h-5 text-purple-600" />
                Order Items
              </h2>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">S.No</th>
                      <th className="px-4 py-3 text-left font-semibold">Description</th>
                      <th className="px-4 py-3 text-center font-semibold">Qty</th>
                      <th className="px-4 py-3 text-right font-semibold">Unit Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment summary with GST */}
            <div className="bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Summary</h2>

              <div className="space-y-2 text-sm">
                <Line label="Subtotal" value={formatCurrency(gst?.subtotal || 0)} />

                {(gst?.extraDiscount ?? 0) > 0 && (
                  <Line label="Extra Discount" value={`- ${formatCurrency(gst!.extraDiscount)}`} color="text-red-600" />
                )}

                <Line label="Amount before GST" value={formatCurrency(gst?.totalBeforeGST || 0)} />

                {/* GST breakdown */}
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1.5">
                  <Line label="GST on Items (18%)" value={formatCurrency(gst?.gstOnItems.gstAmount || 0)} muted />
                  {gst?.gstOnShipping && (
                    <Line label="GST on Shipping (5%)" value={formatCurrency(gst.gstOnShipping.gstAmount)} muted />
                  )}
                  <Line label="Total GST" value={formatCurrency(gst?.totalGST || 0)} bold />
                </div>

                <Line
                  label="Shipping"
                  value={(gst?.shipping || 0) > 0 ? formatCurrency(gst!.shipping) : 'Free'}
                />

                {order.coupon.isApplied && (
                  <Line
                    label={`Coupon Discount (${order.coupon.code})`}
                    value={`- ${formatCurrency(gst?.couponDiscount || 0)}`}
                    color="text-red-600"
                  />
                )}

                {/* Final total */}
                <div className="border-t-2 border-gray-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-purple-600">{formatCurrency(gst?.finalAmount || 0)}</span>
                  </div>
                </div>

                {/* COD details */}
                {order.paymentType === 'offline' && (
                  <div className="border-t border-dashed border-gray-300 pt-3 mt-3 space-y-1.5">
                    <Line label="Amount Paid (Advance)" value={formatCurrency(order.payAmt)} color="text-green-600" />
                    <Line
                      label="Due on Delivery"
                      value={formatCurrency((gst?.finalAmount || 0) - order.payAmt)}
                      color="text-rose-600"
                      bold
                    />
                  </div>
                )}
              </div>
            </div>

            {/* GST declaration */}
            <div className="mt-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg flex gap-3">
              <RiInformationLine className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-purple-900 leading-relaxed">
                <strong>GST Information:</strong> This invoice includes Goods and Services Tax (GST)
                at applicable rates. Items are taxed at 18% and shipping at 5% as per current GST regulations.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 sm:px-10 py-5 text-center">
            <p className="font-semibold text-gray-800">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-1">
              Invoice generated on {formatDate(new Date())} · Computer-generated, no signature required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoBlock = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
    <h2 className="text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
      <Icon className="w-4 h-4 text-purple-600" />
      {title}
    </h2>
    <div className="text-sm text-gray-700 leading-relaxed">{children}</div>
  </div>
);

const Line = ({
  label,
  value,
  color = 'text-gray-900',
  muted = false,
  bold = false,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
  muted?: boolean;
  bold?: boolean;
}) => (
  <div className="flex justify-between items-center">
    <span className={muted ? 'text-gray-500 text-xs' : 'text-gray-600'}>{label}</span>
    <span className={`${color} ${bold ? 'font-semibold' : muted ? 'text-xs' : 'font-medium'}`}>
      {value}
    </span>
  </div>
);