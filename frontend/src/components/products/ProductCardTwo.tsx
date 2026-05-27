
"use client";

import { wishlistService } from "@/_services/common/wishlist";
import { formatCurrency } from "@/helpers/helpers";
import { Product } from "@/lib/types/product";

import { useCartStore } from "@/store/useCartStore";
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

const ProductCardTwo = ({
  product,
}: PopupProps) => {

  const addToCart = useCartStore(
    (state) => state.addToCart
  );

  const isLoggedIn = useUserStore(
    (state) => state.isLoggedIn
  );

  const router = useRouter();

  const { openQuickView } =
    useQuickStore();

  const handleAddToCart = (
    product: Product
  ) => {

    if (product?.isCustomize) {
      return router.push(
        product?.customizeLink
      );
    }

    addToCart(product, 1);

    toast.success("Added to cart");
  };

  const quickViewModel = () => {
    openQuickView(product);
  };

  const handleAddToWishlist =
    async (product: Product) => {

      if (!isLoggedIn)
        return router.push("/login");

      const response =
        await wishlistService.addWishlist(
          product._id
        );

      toast.success(response.message);
    };

  const finalPrice =
    product.discountType ===
    "percentage"
      ? product.price -
        (product.price *
          product.discountPrice) /
          100
      : product.price -
        product.discountPrice;

  return (
    <div className="group h-full">
      <div className="relative flex flex-col h-full overflow-hidden rounded-[10px] border border-white/10 bg-[#13132a] hover:border-amber-400/40 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-amber-400/10">

        {/* Image */}
        <div className="relative aspect-[4/4.5] overflow-hidden">

          {/* Product Image */}
          <Link
            href={`/product-details/${product.slug}`}
            className="block relative h-full"
          >

            <Image
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              src={product?.thumbnail?.url}
              alt={product.title}
              width={800}
              height={800}
              loading="lazy"
            />

            {product.images?.[0]
              ?.url && (
              <Image
                className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700"
                src={
                  product.images[0].url
                }
                alt={product.title}
                width={800}
                height={800}
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-transparent to-transparent" />

          </Link>

          {/* Top Badges */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between">

            {/* Left */}
            <div className="flex flex-col gap-2">

              {(product.new ||
                product.trending ||
                product.sale) && (
                <span className="inline-flex items-center bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">

                  {product.new
                    ? "NEW"
                    : product.trending
                    ? "TRENDING"
                    : "SALE"}

                </span>
              )}

            </div>

            {/* Discount */}
            {product.discountPrice >
              0 && (
              <span className="inline-flex items-center bg-amber-400 text-black text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">

                {product.discountType ===
                "percentage"
                  ? `${product.discountPrice}% OFF`
                  : `${formatCurrency(
                      product.discountPrice
                    )} OFF`}

              </span>
            )}

          </div>

          {/* Floating Actions */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 translate-x-5 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 z-30">

            {/* Wishlist */}
            <button
              onClick={() =>
                handleAddToWishlist(
                  product
                )
              }
              className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-amber-400 hover:border-amber-400 transition-all duration-300 flex items-center justify-center group/btn"
            >

              <RiHeart3Line
                size={18}
                className="text-white group-hover/btn:text-black"
              />

            </button>

            {/* Quick View */}
            <button
              onClick={quickViewModel}
              className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-amber-400 hover:border-amber-400 transition-all duration-300 flex items-center justify-center group/btn"
            >

              <RiEyeLine
                size={18}
                className="text-white group-hover/btn:text-black"
              />

            </button>

          </div>

        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">

          {/* Category */}
          <div className="flex items-center gap-2 mb-1">

            <RiFlashlightLine
              size={14}
              className="text-amber-400"
            />

            <span className="text-white/40 text-[11px] uppercase tracking-[0.15em] font-semibold">

              {product?.category?.name ||
                "Premium Product"}

            </span>

          </div>

          {/* Title */}
          <Link
            href={`/product-details/${product.slug}`}
            className="block min-h-[56px]"
          >

            <h3
              className="text-white text-base sm:text-lg font-bold leading-snug line-clamp-2 hover:text-amber-300 transition-colors"
              style={{
                fontFamily:
                  "'Cormorant Garamond', serif",
              }}
            >
              {product.title}
            </h3>

          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">

            {[...Array(5)].map((_, i) => (
              <RiStarSmileLine
                key={i}
                size={14}
                className="text-amber-400"
              />
            ))}

            <span className="text-white/40 text-xs ml-2">
              (5.0)
            </span>

          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom */}
          <div className="pt-1 mt-1 border-t border-white/10">

            {product?.showPrice ? (

              <div className="flex items-center justify-between gap-3">

                {/* Price */}
                <div className="flex flex-col">

                  <div className="flex items-center gap-2 flex-wrap">

                    <span className="text-amber-400 text-2xl font-bold leading-none">

                      {formatCurrency(
                        finalPrice
                      )}

                    </span>

                    {product.discountPrice >
                      0 && (
                      <span className="text-white/30 text-sm line-through">

                        {formatCurrency(
                          product.price
                        )}

                      </span>
                    )}

                  </div>

                  <span className="text-emerald-400 text-xs mt-2 font-medium">
                    In Stock
                  </span>

                </div>

                {/* Cart Button FIXED */}
                <button
                  onClick={() =>
                    handleAddToCart(product)
                  }
                  className="shrink-0 w-[48px] h-[48px] rounded-2xl bg-amber-400 hover:bg-white transition-all duration-300 flex items-center justify-center"
                >

                  <RiShoppingBag4Line
                    size={20}
                    className="text-black"
                  />

                </button>

              </div>

            ) : (

              <button
                onClick={() =>
                  router.push(
                    product?.customizeLink
                  )
                }
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




// "use client"
// import { wishlistService } from '@/_services/common/wishlist';
// import { formatCurrency } from '@/helpers/helpers';
// import { fetchSignedUrl } from '@/lib/cloudinary';
// import { Product } from '@/lib/types/product';
// import { useCartStore } from '@/store/useCartStore';
// import useQuickStore from '@/store/useQuickStore';
// import { useUserStore } from '@/store/useUserStore';
// import Image from 'next/image';
// import Link from 'next/link';
// import { useRouter } from 'next/navigation';

// import React, { useEffect, useState } from 'react'
// import { toast } from 'react-toastify';

// interface PopupProps {
//     product: Product;
// }


// const ProductCardTwo = ({ product }: PopupProps) => {
   




//     const addToCart = useCartStore(state => state.addToCart);
//     const isLoggedIn = useUserStore((state) => state.isLoggedIn);
//     const router = useRouter();
//     const handleAddToCart = (product: Product) => {
//         if (product?.isCustomize) {
//             return router.push(product?.customizeLink);
//         }
//         addToCart(product, 1);
//         toast('Added to cart');
//     };


//     const { openQuickView } = useQuickStore();

//     const quickViewModel = () => {
//         openQuickView(product);
//     }
//     const handleAddToWishlist = async (product: Product) => {
//         if (!isLoggedIn) return router.push('/login');
//         const response = await wishlistService.addWishlist(product._id);

//         toast(response.message);
//     }



//     return (
//         <>
//             <div
//                 className="bb-deal-card p-[12px]"
//                 data-aos="fade-up"
//                 data-aos-duration={1000}
//                 data-aos-delay={200}
//             >
//                 <div className="bb-pro-box bg-[#fff] border-[1px] border-solid border-[#eee] rounded-[15px]">
//                     <div className="bb-pro-img overflow-hidden relative border-b-[1px] border-solid border-[#eee] z-[4]">
//                         <span className="flags transition-all duration-[0.3s] ease-in-out absolute z-[5] top-[10px] left-[6px]">
//                             <span className="text-[14px] text-[#777] font-medium uppercase">
//                                 {(product.new || product.trending || product.sale) && (
//                                     <span className="text-[14px] text-[#777] font-medium uppercase">
//                                         {product.new ? "New" : product.trending ? "Trend" : "Sale"}
//                                     </span>
//                                 )}
//                             </span>
//                         </span>
//                         {product.discountPrice > 0 && (
//                             <span className={`discount transition-all duration-[0.3s] ease-in-out absolute z-[5] top-[10px] right-[10px] bg-rose-500 text-[#fff] font-medium text-[12px] px-2 rounded-full`}>
//                                 <span className="max-[576px]:hidden">SAVE </span>
//                                 {
//                                     product.discountType === 'percentage'
//                                         ? `${product?.discountPrice}%`
//                                         : `${formatCurrency(product?.discountPrice)}`
//                                 }
//                             </span>
//                         )}

//                         <Link href={`/product-details/${product.slug}`}>
//                             <div className="inner-img relative block overflow-hidden pointer-events-none rounded-t-[15px]">
//                                 <Image
//                                     className="main-img transition-all duration-[0.3s] ease-in-out w-full"
//                                     src={product?.thumbnail?.url}

//                                     alt={product.title}
//                                     width={800}
//                                     height={800}
//                                     loading='lazy'
//                                 />
//                                 <Image
//                                     className="hover-img transition-all duration-[0.3s] ease-in-out absolute z-[2] top-[0] left-[0] opacity-[0] w-full"
//                                     src={product.images[0]?.url}
//                                     alt={product.title}
//                                     width={800}
//                                     height={800}
//                                 />
//                             </div>
//                         </Link>
//                         <ul className="bb-pro-actions transition-all duration-[0.3s] ease-in-out my-[0] mx-[auto] absolute z-[9] left-[0] right-[0] bottom-[0] flex flex-row items-center justify-center opacity-[0]">
//                             <li className="bb-btn-group transition-all duration-[0.3s] ease-in-out w-[35px] h-[35px] mx-[2px] flex items-center justify-center text-[#fff] bg-[#fff] border-[1px] border-solid border-[#eee] rounded-[10px]">
//                                 <button
//                                     onClick={() => handleAddToWishlist(product)}
//                                     title="Wishlist"
//                                     className="w-[35px] h-[35px] flex items-center justify-center"
//                                 >
//                                     <i className="ri-heart-line transition-all duration-[0.3s] ease-in-out text-[18px] text-[#777] leading-[10px]" />
//                                 </button>
//                             </li>
//                             <li className="bb-btn-group transition-all duration-[0.3s] ease-in-out w-[35px] h-[35px] mx-[2px] flex items-center justify-center text-[#fff] bg-[#fff] border-[1px] border-solid border-[#eee] rounded-[10px]">
//                                 <button
//                                     onClick={quickViewModel}
//                                     title="Quick View"
//                                     className="bb-modal-toggle w-[35px] h-[35px] flex items-center justify-center"
//                                 >
//                                     <i className="ri-eye-line transition-all duration-[0.3s] ease-in-out text-[18px] text-[#777] leading-[10px]" />
//                                 </button>
//                             </li>
//                             {/* <li className="bb-btn-group transition-all duration-[0.3s] ease-in-out w-[35px] h-[35px] mx-[2px] flex items-center justify-center text-[#fff] bg-[#fff] border-[1px] border-solid border-[#eee] rounded-[10px]">
//                                 <Link
//                                     href="/compare"
//                                     title="Compare"
//                                     className="w-[35px] h-[35px] flex items-center justify-center"
//                                 >
//                                     <i className="ri-repeat-line transition-all duration-[0.3s] ease-in-out text-[18px] text-[#777] leading-[10px]" />
//                                 </Link>
//                             </li> */}
//                             <li className="bb-btn-group transition-all duration-[0.3s] ease-in-out w-[35px] h-[35px] mx-[2px] flex items-center justify-center text-[#fff] bg-[#fff] border-[1px] border-solid border-[#eee] rounded-[10px]">
//                                 <button
//                                     onClick={() => handleAddToCart(product)}
//                                     title="Add To Cart"
//                                     className="w-[35px] h-[35px] flex items-center justify-center"
//                                 >
//                                     <i className="ri-shopping-bag-4-line transition-all duration-[0.3s] ease-in-out text-[18px] text-[#777] leading-[10px]" />
//                                 </button>
//                             </li>
//                         </ul>
//                     </div>
//                     <div className="bb-pro-contact p-[20px] max-[576px]:p-[10px]">
//                         {/* <div className="bb-pro-subtitle mb-[8px] flex flex-wrap justify-between">
//                             <Link
//                                 href={`/category/${product?.category?.slug}`}
//                                 className="transition-all duration-[0.3s] ease-in-out font-Poppins text-[13px] leading-[16px] text-[#777] font-light tracking-[0.03rem]"
//                             >
//                                 {product?.category?.name || 'PrintHutt'}
//                             </Link>
//                             <span className="bb-pro-rating">
//                                 <i className={`float-left text-[15px] mr-[3px] leading-[18px] 
//                                             ri-star-fill text-[#e4c22a]`}
//                                 />
//                                 {Math.round(product.rating)}
//                             </span>
//                         </div> */}
//                         <h4 className="bb-pro-title mb-[8px] text-[16px] leading-[18px]">
//                             <Link href={`/product-details/${product.slug}`}
//                                 className="transition-all duration-[0.3s] ease-in-out font-quicksand w-full block whitespace-nowrap overflow-hidden text-ellipsis text-[15px] leading-[18px] text-[#3d4750] font-semibold tracking-[0.03rem]"
//                             >
//                                 {product.title}
//                             </Link>
//                         </h4>
//                         {product?.showPrice ? (
//                             <div className="bb-price flex flex-wrap justify-between">
//                                 <div className="inner-price mx-[-3px]">
//                                     <span className="new-price px-[3px] text-[16px]  text-green-800 font-bold">
//                                         {product.discountType === 'percentage'
//                                             ? formatCurrency(product.price - (product.price * product.discountPrice) / 100)
//                                             : formatCurrency(product.price - product.discountPrice)}
//                                     </span>
//                                     <span className="old-price px-[3px] text-[14px]  text-rose-600 line-through">
//                                         {product.discountPrice > 0 ? formatCurrency(product.price) : ''}
//                                     </span>
//                                 </div>
//                                 <span className="last-items text-[14px] text-[#1f44a0] hidden md:block">In Stock</span>
//                             </div>
//                         ) : (
//                             <Link
//                                 href={product?.customizeLink}
//                                 className="font-Poppins leading-[28px]  text-[#6c7fd8] hover:text-[#3d4750]"
//                             >
//                                 Customize & Buy
//                             </Link>
//                         )}
//                     </div>
//                 </div>
//             </div>

//         </>
//     )
// }

// export default ProductCardTwo