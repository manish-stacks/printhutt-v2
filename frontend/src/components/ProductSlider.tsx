"use client";

import React, { useRef } from "react";
import { Product } from "@/lib/types/product";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import ProductCard from "./products/ProductCard";
import { RiArrowLeftSLine, RiArrowRightSLine, RiArrowRightLine } from "react-icons/ri";
import Link from "next/link";

import "swiper/css";
import "swiper/css/pagination";

interface Props {
  products: Product[];
  title?: string;
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
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-9">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 mb-2 rounded-full bg-[#3C2A6D]/8 bg-purple-50 px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#3C2A6D]">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              Handpicked for you
            </span>
            <h2
              className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#0d0d1a] truncate"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {title}
            </h2>
            <p className="mt-2 hidden sm:block text-gray-500 text-sm sm:text-base max-w-xl leading-relaxed">
              {description || defaultDesc}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {categorySlug && (
              <Link
                href={`/category/${categorySlug}`}
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm hover:border-purple-400 hover:text-[#3C2A6D] transition group"
              >
                View all
                <RiArrowRightLine className="w-4 h-4 group-hover:translate-x-0.5 transition" />
              </Link>
            )}
            <button onClick={() => swiperRef.current?.slidePrev()} aria-label="Previous"
              className="hidden sm:flex w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:border-purple-400 hover:bg-purple-50 text-gray-700 hover:text-[#3C2A6D] items-center justify-center transition-all active:scale-95">
              <RiArrowLeftSLine className="w-5 h-5" />
            </button>
            <button onClick={() => swiperRef.current?.slideNext()} aria-label="Next"
              className="hidden sm:flex w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm hover:border-purple-400 hover:bg-purple-50 text-gray-700 hover:text-[#3C2A6D] items-center justify-center transition-all active:scale-95">
              <RiArrowRightSLine className="w-5 h-5" />
            </button>
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
                <ProductCard product={product} variant="dark" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom pagination container */}
        <div className="product-slider-pagination flex justify-center gap-2 mt-6 sm:mt-8" />

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