"use client";

import { formatCurrency } from "@/helpers/helpers";
import { useCartStore } from "@/store/useCartStore";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import {
  RiArrowRightSLine,
  RiCloseLine,
  RiAddLine,
  RiSubtractLine,
  RiDeleteBin6Line,
  RiShoppingCart2Line,
  RiGift2Line,
} from "react-icons/ri";
import { toast } from "react-toastify";
import CheckOutPopUpV2 from "./CheckOutPopUpV2";
import GiftCustomizeModal from "./GiftCustomizeModal";
import { FREE_THRESHOLD } from "@/lib/constants/gift";



const CartSidebar = ({ onClose }: { onClose: () => void }) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [totalPrice, setTotalPrice] = useState({
    totalPrice: 0,
    discountPrice: 0,
    shippingTotal: 0,
  });
  const { items, updateQuantity, removeFromCart, getTotalPrice } = useCartStore();
  const [showMailModal, setShowMailModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);

  /* ── Update totals when items change ── */
  useEffect(() => {
    setTotalPrice(getTotalPrice());
  }, [items]);

  /* ── ESC + scroll lock ── */
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleQuantityChange = (productId: string, newQty: number) => {
    if (newQty < 1) {
      removeFromCart(productId);
      toast.info("Item removed");
    } else {
      updateQuantity(productId, newQty);
    }
  };

  const checkoutPage = () => {
    if (!items.length) {
      toast.error("Please add items to cart");
      return;
    }
    setShowMailModal(true);
  };

  /* ── Item-level discounted price ── */
  const itemFinalPrice = (item: any) => {
    if (!item?.price || !item?.discountType || !item?.discountPrice) return item.price;
    return item.discountType === "percentage"
      ? item.price - (item.price * item.discountPrice) / 100
      : item.price - item.discountPrice;
  };

  /* ── Free gift progress ── */
  const progressPercent = Math.min(
    100,
    Math.round((totalPrice.discountPrice / FREE_THRESHOLD) * 100)
  );
  const remainingForGift = Math.max(0, FREE_THRESHOLD - totalPrice.discountPrice);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[17]"
        onClick={onClose}
        style={{ height: '100dvh' }}
      />

      {/* Sidebar */}
      <div
        ref={popupRef}
        className="fixed inset-y-0 right-0 w-full max-w-[440px] bg-white z-[99] shadow-2xl flex flex-col animate-slide-in"
        style={{ height: '100dvh' }}
      >
        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <RiShoppingCart2Line className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base leading-tight">My Cart</h3>
              <p className="text-xs text-gray-500">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-500 flex items-center justify-center transition"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* ─── FREE GIFT PROGRESS ─── */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 flex-shrink-0">
            <div className="flex items-center gap-2 mb-1.5">
              <RiGift2Line className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-medium text-gray-700 flex-1">
                {remainingForGift > 0 ? (
                  <>
                    Add <strong className="text-purple-600">{formatCurrency(remainingForGift)}</strong> more for a{" "}
                    <strong>FREE gift</strong> 🎁
                  </>
                ) : (
                  <span className="text-green-600 font-semibold">🎉 Free gift unlocked!</span>
                )}
              </p>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* ─── ITEMS LIST ─── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <RiShoppingCart2Line className="w-10 h-10 text-gray-300" />
              </div>
              <h4 className="text-base font-semibold text-gray-800">Your cart is empty</h4>
              <p className="text-sm text-gray-500 mt-1">Add items to get started</p>
              <Link
                href="/products"
                onClick={onClose}
                className="mt-5 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item._id}
                  className={`relative rounded-2xl p-3 border transition ${item.isGift
                    ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
                    : "bg-gray-50 border-gray-100 hover:bg-white hover:shadow-sm"
                    }`}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <Link
                      href={`/product-details/${item.slug}`}
                      onClick={onClose}
                      className="flex-shrink-0"
                    >
                      <Image
                        src={item.thumbnail.url}
                        alt={item.title}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-xl object-cover bg-white border border-gray-100"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      {item.isGift ? (
                        <>
                          <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mb-1">
                            <RiGift2Line className="w-3 h-3" /> Free Gift
                          </div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                            {item.title}
                          </p>
                          <button
                            onClick={() => setShowGiftModal(true)}
                            className="text-xs text-purple-600 hover:text-purple-700 underline mt-1 font-medium"
                          >
                            Customize / Upload photo
                          </button>
                        </>
                      ) : (
                        <Link
                          href={`/product-details/${item.slug}`}
                          onClick={onClose}
                          className="block"
                        >
                          <p
                            className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug hover:text-purple-600 transition"
                            dangerouslySetInnerHTML={{ __html: item.title }}
                          />
                        </Link>
                      )}

                      {/* Price */}
                      {item.price !== 0 && (
                        <div className="flex items-baseline gap-2 mt-1.5">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(itemFinalPrice(item))}
                          </span>
                          {item.discountPrice ? (
                            <span className="text-xs text-gray-400 line-through">
                              {formatCurrency(item.price)}
                            </span>
                          ) : null}
                        </div>
                      )}

                      {/* Quantity controls */}
                      <div className="flex items-center justify-between mt-2">
                        {!item.isGift ? (
                          <div className="flex items-center bg-white border border-gray-200 rounded-full overflow-hidden">
                            <button
                              onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition"
                              aria-label="Decrease"
                            >
                              <RiSubtractLine className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition"
                              aria-label="Increase"
                            >
                              <RiAddLine className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs italic text-amber-700">Complimentary</span>
                        )}

                        {!item.isGift && (
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="text-gray-400 hover:text-red-500 transition p-1.5 rounded-lg hover:bg-red-50"
                            aria-label="Remove"
                          >
                            <RiDeleteBin6Line className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ─── FOOTER (totals + checkout) ─── */}
        {items.length > 0 && (
          <div
            className="border-t border-gray-100 px-5 pt-4 bg-white flex-shrink-0"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {/* Totals */}
            <div className="space-y-1.5 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <div className="text-right">
                  {totalPrice.totalPrice !== totalPrice.discountPrice && (
                    <span className="text-xs text-gray-400 line-through mr-2">
                      {formatCurrency(totalPrice.totalPrice)}
                    </span>
                  )}
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(totalPrice.discountPrice)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="text-gray-900 font-medium">
                  {totalPrice.shippingTotal > 0
                    ? formatCurrency(totalPrice.shippingTotal)
                    : <span className="text-green-600">Free</span>}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                <span className="text-base font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-purple-600">
                  {formatCurrency(totalPrice.discountPrice + totalPrice.shippingTotal)}
                </span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={checkoutPage}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3.5 rounded-xl text-base font-semibold shadow-md shadow-purple-200 transition active:scale-[0.99]"
            >
              Proceed to Checkout
              <RiArrowRightSLine className="w-5 h-5" />
            </button>

            {/* UPI payments info */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
              <span>Pay with</span>
              <Image
                src="/img/shape/upi_options.svg"
                alt="Payment options"
                width={120}
                height={20}
                className="h-5 w-auto opacity-70"
              />
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        .animate-slide-in {
          animation: slide-in 0.35s ease-out;
        }
      `}</style>

      {/* Modals */}
      {showMailModal && (
        <CheckOutPopUpV2 isOpen={showMailModal} onClose={() => setShowMailModal(false)} />
      )}
      {showGiftModal && <GiftCustomizeModal onClose={() => setShowGiftModal(false)} />}
    </>
  );
};

export default CartSidebar;