"use client";

import React, { useRef } from "react";
import { Product } from "@/lib/types/product";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import ProductCardTwo from "./products/ProductCardTwo";
import { RiArrowLeftSLine, RiArrowRightSLine, RiArrowRightLine } from "react-icons/ri";
import Link from "next/link";

import "swiper/css";
import "swiper/css/pagination";

interface Props {
  products: Product[];
  title: string;
  description?: string;
}

const ProductSlider = ({ products, title, description }: Props) => {
  const swiperRef = useRef<SwiperType | null>(null);

  if (!products?.length) return null;

  const categorySlug = products[0]?.category?.slug;
  const defaultDesc =
    "Discover premium handcrafted products, glowing gifts and personalized designs curated specially for you.";

  return (
    <section className="relative py-10 sm:py-14 overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">

        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8 sm:mb-10">

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-0.5 w-8 sm:w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
              <Link
                href={categorySlug ? `/category/${categorySlug}` : '#'}
                className="text-xs sm:text-sm lg:text-2xl uppercase tracking-[0.25em] font-semibold text-purple-600 hover:text-purple-700 transition"
              >
                {title}
              </Link>
            </div>

            <p className="text-gray-500 text-sm sm:text-base max-w-xl leading-relaxed">
              {description || defaultDesc}
            </p>
          </div>

          {/* Right: View All + nav arrows */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {categorySlug && (
              <Link
                href={`/category/${categorySlug}`}
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-purple-600 transition group"
              >
                View All
                <RiArrowRightLine className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                aria-label="Previous"
                className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md text-gray-700 hover:text-purple-600 flex items-center justify-center transition-all active:scale-95"
              >
                <RiArrowLeftSLine className="w-5 h-5" />
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                aria-label="Next"
                className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 hover:shadow-md text-gray-700 hover:text-purple-600 flex items-center justify-center transition-all active:scale-95"
              >
                <RiArrowRightSLine className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── SLIDER ─── */}
        <Swiper
          onSwiper={(s) => { swiperRef.current = s; }}
          modules={[Navigation, Autoplay, Pagination]}
          spaceBetween={16}
          slidesPerView={2}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop={products.length > 4}
          speed={700}
          pagination={{
            clickable: true,
            el: '.product-slider-pagination',
          }}
          breakpoints={{
            640: { slidesPerView: 2, spaceBetween: 16 },
            768: { slidesPerView: 3, spaceBetween: 18 },
            1024: { slidesPerView: 4, spaceBetween: 20 },
          }}
          className="!overflow-visible"
        >
          {products.map((product, i) => (
            <SwiperSlide key={product._id || i} className="h-auto">
              <div className="h-full">
                <ProductCardTwo product={product} />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom pagination container */}
        <div className="product-slider-pagination flex justify-center gap-2 mt-6 sm:mt-8" />

        {/* Mobile: view all link */}
        {categorySlug && (
          <div className="sm:hidden text-center mt-4">
            <Link
              href={`/category/${categorySlug}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-purple-600"
            >
              View All Products <RiArrowRightLine className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Decorative blur */}
      <div className="absolute -z-0 top-1/2 right-0 -translate-y-1/2 w-[300px] h-[300px] bg-purple-200/20 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -z-0 top-1/3 left-0 w-[200px] h-[200px] bg-pink-200/15 blur-3xl rounded-full pointer-events-none" />

      {/* Custom pagination dots */}
      <style jsx global>{`
        .product-slider-pagination .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #d1d5db;
          opacity: 1;
          border-radius: 9999px;
          transition: all 0.3s ease;
        }
        .product-slider-pagination .swiper-pagination-bullet-active {
          background: linear-gradient(to right, #9333ea, #ec4899);
          width: 24px;
        }
      `}</style>
    </section>
  );
};

export default ProductSlider;