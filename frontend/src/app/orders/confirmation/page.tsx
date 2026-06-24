"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { useEffect, useState, Suspense } from "react";
import confetti from "canvas-confetti";
import { firePurchaseFromSession, getLastOrder } from "@/lib/pixel";
import { formatCurrency } from "@/helpers/helpers";

export default function OrderConfirmation() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}

type LastOrderItem = {
    name: string;
    image: string;
    quantity: number;
    price: number;
    discountType: string;
    discountPrice: number;
};
type LastOrder = {
    orderId: string;
    paymentType: string;
    payAmt: number;
    totalAmount: { discountPrice: number; shippingTotal: number };
    items: LastOrderItem[];
    shipping: {
        userName: string;
        mobileNumber: string;
        addressLine: string;
        city: string;
        state: string;
        postCode: string;
    } | null;
};

/** Item ka final unit price (discount apply karke) */
function unitPrice(it: LastOrderItem): number {
    if (!it.discountPrice) return it.price;
    return it.discountType === "percentage"
        ? Math.round(it.price - (it.price * it.discountPrice) / 100)
        : Math.round(it.price - it.discountPrice);
}

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const success = searchParams?.get("success") === "true";
    const { clearCart } = useCartStore();
    const [order, setOrder] = useState<LastOrder | null>(null);

    useEffect(() => {
        clearCart();
        if (success) {
            // stashed order (checkout pe save kiya) — URL me id ki zarurat nahi
            setOrder(getLastOrder());

            // 📊 Meta Pixel Purchase event
            firePurchaseFromSession();

            const end = Date.now() + 2 * 1000;
            const colors = ["#ffffff", "#E4037C"];
            (function frame() {
                confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors });
                confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors });
                if (Date.now() < end) requestAnimationFrame(frame);
            })();
        }
    }, [success]);

    if (!success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 text-center">
                    <Image
                        src="https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/error_gjjbgx_zm8hkz.gif"
                        width={180}
                        height={180}
                        alt="Error"
                        className=" mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-red-700 mb-4">Invalid Order</h1>
                    <p className="text-gray-600 mb-6">
                        We couldn&apos;t find the order details. Please try again or contact support.
                    </p>
                    <Link href="/" className="bg-gray-600 text-white px-5 py-3 rounded">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    const orderTotal = order
        ? Math.round((order.totalAmount?.discountPrice || 0) + (order.totalAmount?.shippingTotal || 0))
        : 0;
    const isCOD = order?.paymentType !== "online";
    const balanceDue = isCOD ? Math.max(0, orderTotal - (order?.payAmt || 0)) : 0;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <Image
                            src="https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/check-circle_josi46_xkonkj.gif"
                            width={120}
                            height={120}
                            alt="Success"
                            className=" mx-auto mb-4"
                        />
                        <h1 className="text-2xl font-bold text-gray-900">Order Successfully Placed!</h1>
                        <p className="text-gray-600 mt-2">
                            Thank you for your purchase. Your order has been received.
                        </p>
                        {order?.orderId && (
                            <p className="text-gray-800 mt-3 text-sm">
                                Order ID:{" "}
                                <span className="font-semibold text-[#E4037C]">{order.orderId}</span>
                            </p>
                        )}
                    </div>

                    {/* Order summary (sessionStorage se) */}
                    {order && order.items?.length > 0 && (
                        <div className="border border-gray-100 rounded-lg overflow-hidden mb-6">
                            <div className="bg-gray-50 px-5 py-3 flex items-center justify-between">
                                <span className="font-semibold text-gray-800">Order Summary</span>
                                <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-700">
                                    {isCOD ? "COD" : "Prepaid"}
                                </span>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {order.items.map((it, idx) => (
                                    <div key={idx} className="flex items-center gap-4 px-5 py-4">
                                        <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                                            {it.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={it.image}
                                                    alt={it.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : null}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{it.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {formatCurrency(unitPrice(it))} × {it.quantity}
                                            </p>
                                        </div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(unitPrice(it) * it.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="px-5 py-4 bg-gray-50 space-y-1.5 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(order.totalAmount?.discountPrice || 0)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery</span>
                                    <span>
                                        {order.totalAmount?.shippingTotal > 0
                                            ? formatCurrency(order.totalAmount.shippingTotal)
                                            : "Free"}
                                    </span>
                                </div>
                                <div className="flex justify-between font-semibold text-gray-900 pt-1.5 border-t border-gray-200">
                                    <span>Order Total</span>
                                    <span>{formatCurrency(orderTotal)}</span>
                                </div>
                                {isCOD && (
                                    <>
                                        <div className="flex justify-between text-green-700">
                                            <span>Advance Paid</span>
                                            <span>{formatCurrency(order.payAmt || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-800">
                                            <span>Balance on Delivery</span>
                                            <span>{formatCurrency(balanceDue)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Delivery address */}
                    {order?.shipping && (
                        <div className="border border-gray-100 rounded-lg p-5 mb-6">
                            <p className="font-semibold text-gray-800 mb-2">Delivery Address</p>
                            <p className="text-sm text-gray-700">{order.shipping.userName}</p>
                            <p className="text-sm text-gray-600 mt-0.5">
                                {order.shipping.addressLine}, {order.shipping.city}, {order.shipping.state} —{" "}
                                {order.shipping.postCode}
                            </p>
                            {order.shipping.mobileNumber && (
                                <p className="text-sm text-gray-600 mt-0.5">📞 {order.shipping.mobileNumber}</p>
                            )}
                        </div>
                    )}

                    <p className="text-center text-gray-600 text-sm">
                        {`We'll email you an order confirmation with details and tracking info.`}
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                        <Link
                            href="/user/orders"
                            className="bg-blue-600 text-white px-5 py-3 rounded text-center"
                        >
                            View All Orders
                        </Link>
                        <Link
                            href="/"
                            className="bg-gray-600 text-white px-5 py-3 rounded text-center"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}