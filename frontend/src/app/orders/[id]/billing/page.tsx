"use client";
import { notFound, useParams } from 'next/navigation';
import { formatCurrency, formatDate } from '@/helpers/helpers';
import { useEffect, useState } from 'react';
import { IOrder } from '@/lib/types/order';
import { get_order_details } from '@/_services/common/order';
import { usePDF } from 'react-to-pdf';

export default function OrderDetailsPage() {
    const params = useParams();
    const [order, setOrder] = useState<IOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const { toPDF, targetRef } = usePDF({ filename: `invoice_${order?.orderId || 'order'}.pdf` });

    const fetchOrder = async () => {
        try {
            const orderData = await get_order_details(params.id);
            setOrder(orderData.data);
        } catch (error) {
            console.error("Error fetching order details:", error);
            notFound();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (params?.id) {
            fetchOrder();
        }

    }, [params]);

    useEffect(() => {
        if (!loading && order) {
            setTimeout(async () => {
                await toPDF();              // generate + auto download
                window.close();
                // window.history.back();      // redirect back after download
            }, 800); // slight delay so UI fully renders
        }
    }, [loading, order]);

    // GST Calculations
    const calculateGST = (amount: number, gstRate: number = 18) => {
        const baseAmount = amount / (1 + gstRate / 100);
        const gstAmount = amount - baseAmount;
        return {
            baseAmount,
            gstAmount,
            gstRate
        };
    };

    const getGSTBreakdown = () => {
        if (!order) return null;

        const subtotal = order.totalAmount.totalPrice;
        const shipping = order.totalAmount.shippingTotal;
        const couponDiscount = order.totalAmount.coupon_discount || 0;
        const extraDiscount = (subtotal + shipping) - (order.totalAmount.discountPrice + shipping);

        // Calculate GST on discounted amount
        const discountedSubtotal = order.totalAmount.discountPrice;
        const gstOnItems = calculateGST(discountedSubtotal, 18);
        const gstOnShipping = shipping > 0 ? calculateGST(shipping, 5) : null;

        const totalBeforeGST = gstOnItems.baseAmount + (gstOnShipping?.baseAmount || 0);
        const totalGST = gstOnItems.gstAmount + (gstOnShipping?.gstAmount || 0);
        const finalAmount = (discountedSubtotal + shipping) - couponDiscount;

        return {
            subtotal,
            shipping,
            couponDiscount,
            extraDiscount,
            discountedSubtotal,
            gstOnItems,
            gstOnShipping,
            totalBeforeGST,
            totalGST,
            finalAmount
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return notFound();
    }

    const paymentStatus = order.payment.isPaid ? 'Paid' : 'Unpaid';
    const gstBreakdown = getGSTBreakdown();



    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mb-6 print:hidden">

                    <button
                        onClick={() => toPDF()}
                        className="flex items-center px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                    </button>
                </div>

                {/* Invoice */}
                <div ref={targetRef} className="bg-white shadow-xl rounded-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
                                    <p className="text-blue-100">Invoice No: #{order.orderId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-100 mb-1">Date: {formatDate(order.createdAt)}</p>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${order.payment.isPaid
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {order.paymentType === 'offline' ? 'Post-Paid' : 'Pre-Paid'}
                                    </span>
                                </div>
                            </div>
                        </div>


                    </div>

                    <div className="p-8">
                        {/* Billing Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Billed To
                                </h2>
                                <div className="text-gray-700 space-y-1">
                                    <p className="font-medium">{order.shipping.userName || 'Guest'}</p>
                                    <p>{order.shipping.addressLine}</p>
                                    <p>{order.shipping.city}, {order.shipping.state} {order.shipping.postCode}</p>
                                    <p className="flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {order.shipping.mobileNumber}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-lg">
                                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    Shipped To
                                </h2>
                                <div className="text-gray-700 space-y-1">
                                    <p className="font-medium">{order.shipping.userName || 'Guest'}</p>
                                    <p>{order.shipping.addressLine}</p>
                                    <p>{order.shipping.city}, {order.shipping.state} {order.shipping.postCode}</p>
                                    <p className="flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {order.shipping.mobileNumber}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Order Details
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                                            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">S.No</th>
                                            <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Item Description</th>
                                            <th className="border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700">Qty</th>
                                            <th className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Price</th>
                                            <th className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                                <td className="border border-gray-200 px-4 py-3">
                                                    <div className="font-medium text-gray-800">{item.name}</div>
                                                </td>
                                                <td className="border border-gray-200 px-4 py-3 text-center text-sm text-gray-600">{item.quantity}</td>
                                                <td className="border border-gray-200 px-4 py-3 text-right text-sm text-gray-600">{formatCurrency(item.price)}</td>
                                                <td className="border border-gray-200 px-4 py-3 text-right font-medium text-gray-800">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Payment Summary with GST */}
                        <div className="bg-gray-50 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Payment Summary
                            </h2>

                            <div className="space-y-3">
                                {/* Basic amounts */}
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-gray-600">Subtotal:</span>
                                    <span className="font-medium">{formatCurrency(gstBreakdown?.subtotal || 0)}</span>
                                </div>

                                {gstBreakdown?.extraDiscount > 0 && (
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-gray-600">Extra Discount:</span>
                                        <span className="font-medium text-red-600">- {formatCurrency(gstBreakdown.extraDiscount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center py-1">
                                    <span className="text-gray-600">Amount before GST:</span>
                                    <span className="font-medium">{formatCurrency(gstBreakdown?.totalBeforeGST || 0)}</span>
                                </div>

                                {/* GST Breakdown */}
                                <div className="border-t border-gray-200 pt-2">
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-gray-600 text-sm">GST on Items (18%):</span>
                                        <span className="text-sm">{formatCurrency(gstBreakdown?.gstOnItems.gstAmount || 0)}</span>
                                    </div>
                                    {gstBreakdown?.gstOnShipping && (
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-600 text-sm">GST on Shipping (5%):</span>
                                            <span className="text-sm">{formatCurrency(gstBreakdown.gstOnShipping.gstAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center py-1 font-medium">
                                        <span className="text-gray-700">Total GST:</span>
                                        <span>{formatCurrency(gstBreakdown?.totalGST || 0)}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-21">
                                    <span className="text-gray-600">Shipping:</span>
                                    <span className="font-medium">
                                        {(gstBreakdown?.shipping || 0) > 0 ? formatCurrency(gstBreakdown!.shipping) : 'Free'}
                                    </span>
                                </div>

                                {order.coupon.isApplied && (
                                    <div className="flex justify-between items-center py-21">
                                        <span className="text-gray-600">Coupon Discount ({order.coupon.code}):</span>
                                        <span className="font-medium text-red-600">- {formatCurrency(gstBreakdown?.couponDiscount || 0)}</span>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="border-t-2 border-gray-300 pt-3 mt-4">
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-lg font-semibold text-gray-800">Total Amount:</span>
                                        <span className="text-lg font-bold text-blue-600">{formatCurrency(gstBreakdown?.finalAmount || 0)}</span>
                                    </div>
                                </div>

                                {/* Payment details for offline orders */}
                                {order.paymentType === 'offline' && (
                                    <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-600">Amount Paid:</span>
                                            <span className="font-medium text-green-600">{formatCurrency(order.payAmt)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1">
                                            <span className="text-gray-600">Due Amount:</span>
                                            <span className="font-medium text-red-600">
                                                {formatCurrency((gstBreakdown?.finalAmount || 0) - order.payAmt)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* GST Declaration */}
                        <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                            <p className="text-sm text-blue-800">
                                <strong>GST Information:</strong> This invoice includes Goods and Services Tax (GST) at applicable rates.
                                Items are taxed at 18% and shipping charges at 5% as per current GST regulations.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-100 px-8 py-6 text-center">
                        <div className="text-gray-600 space-y-2">
                            <p className="font-medium">Thank you for your business!</p>
                            <p className="text-sm">Invoice generated on {formatDate(new Date())}</p>
                            <p className="text-xs">This is a computer-generated invoice and does not require a signature.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}