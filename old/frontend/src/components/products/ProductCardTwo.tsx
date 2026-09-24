"use client";

import { wishlistService } from "@/_services/common/wishlist";
import { formatCurrency } from "@/helpers/helpers";
import { Product } from "@/lib/types/product";
import { useAddToCart } from "@/hooks/useAddToCart";
import useQuickStore from "@/store/useQuickStore";
import { useUserStore } from "@/store/useUserStore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { toast } from "react-toastify";
import {
  RiEyeLine,
  RiHeart3Line,
  RiShoppingBag4Line,
  RiFlashlightLine,
  RiStarSmileLine,
} from "react-icons/ri";

interface PopupProps {
  product: Product;
}

const ProductCardTwo = ({ product }: PopupProps) => {
  // ✅ Common hook — variant auto-pick + cart sidebar open
  const { handleAddToCart } = useAddToCart();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const router = useRouter();
  const { openQuickView } = useQuickStore();

  const quickViewModel = () => openQuickView(product);

  const handleAddToWishlist = async (product: Product) => {
    if (!isLoggedIn) return router.push("/login");
    const response = await wishlistService.addWishlist(product._id);
    toast.success(response.message);
  };

  const finalPrice =
    product.discountType === "percentage"
      ? product.price - (product.price * product.discountPrice) / 100
      : product.price - product.discountPrice;
  const isOutOfStock =
    !product?.status || product?.stock <= 0;
  return (
    <div className="group h-full">
      <div className="relative flex flex-col h-full overflow-hidden rounded-[10px] border border-white/10 bg-[#13132a] hover:border-amber-400/40 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-amber-400/10">

        {/* Image */}
        <div className="relative aspect-[4/4.5] overflow-hidden">
          <Link href={`/product-details/${product.slug}`} className="block relative h-full">
            <Image
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              src={product?.thumbnail?.url}
              alt={product.title}
              width={800}
              height={800}
              loading="lazy"
            />
            {product.images?.[0]?.url && (
              <Image
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700"
                src={product.images[0].url}
                alt={product.title}
                width={800}
                height={800}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-transparent to-transparent" />
          </Link>

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between">
            <div className="flex flex-col gap-2">
              {(product.new || product.trending || product.sale) && (
                <span className="inline-flex items-center bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                  {product.new ? "NEW" : product.trending ? "TRENDING" : "SALE"}
                </span>
              )}
            </div>
            {product.discountPrice > 0 && (
              <span className="inline-flex items-center bg-amber-400 text-black text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                {product.discountType === "percentage"
                  ? `${product.discountPrice}% OFF`
                  : `${formatCurrency(product.discountPrice)} OFF`}
              </span>
            )}
          </div>

          {/* Floating Actions */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 translate-x-5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 z-30">
            <button
              onClick={() => handleAddToWishlist(product)}
              className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-amber-400 hover:border-amber-400 transition-all duration-300 flex items-center justify-center group/btn"
            >
              <RiHeart3Line size={18} className="text-white group-hover/btn:text-black" />
            </button>
            <button
              onClick={quickViewModel}
              className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-amber-400 hover:border-amber-400 transition-all duration-300 flex items-center justify-center group/btn"
            >
              <RiEyeLine size={18} className="text-white group-hover/btn:text-black" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          <div className="flex items-center gap-2 mb-1">
            <RiFlashlightLine size={14} className="text-amber-400" />
            <span className="text-white/40 text-[11px] uppercase tracking-[0.15em] font-semibold">
              {product?.category?.name || "Premium Product"}
            </span>
          </div>

          <Link href={`/product-details/${product.slug}`} className="block min-h-[56px]">
            <h3
              className="text-white text-base sm:text-lg font-bold leading-snug line-clamp-2 hover:text-amber-300 transition-colors"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {product.title}
            </h3>
          </Link>

          <div className="flex items-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <RiStarSmileLine key={i} size={14} className="text-amber-400" />
            ))}
            <span className="text-white/40 text-xs ml-2">(5.0)</span>
          </div>

          <div className="flex-1" />

          <div className="pt-1 mt-1 border-t border-white/10">
            {product?.showPrice ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-amber-400 text-2xl font-bold leading-none">
                      {formatCurrency(finalPrice)}
                    </span>
                    {product.discountPrice > 0 && (
                      <span className="text-white/30 text-sm line-through">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium ${isOutOfStock
                        ? "text-red-400"
                        : "text-emerald-400"
                      }`}
                  >
                    {isOutOfStock ? "Out of Stock" : "In Stock"}
                  </span>
                </div>
                <button
                  onClick={() => !isOutOfStock && handleAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`shrink-0 w-[48px] h-[48px] rounded-2xl flex items-center justify-center transition-all duration-300 ${isOutOfStock
                      ? "bg-gray-500 cursor-not-allowed opacity-50"
                      : "bg-amber-400 hover:bg-white"
                    }`}
                >
                  <RiShoppingBag4Line size={20} className="text-black" />
                </button>
              </div>
            ) : (
              <button
                disabled={isOutOfStock}
                onClick={() => router.push(product?.customizeLink)}
                className="w-full h-[48px] rounded-2xl bg-amber-400 hover:bg-white text-black text-sm font-bold transition-all duration-300"
              >
                Customize Product
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCardTwo;