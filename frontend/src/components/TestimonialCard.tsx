"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Autoplay } from "swiper/modules";
import { RiArrowLeftLine, RiArrowRightLine, RiStarFill, RiDoubleQuotesR, RiCheckboxCircleLine } from "react-icons/ri";
import { testimonialService } from "@/_services/common/testimonialService";
import "swiper/css";

interface ITestimonial {
  _id: string;
  name: string;
  feedback: string;
  rating?: number;
  imgSrc?: string;
  image?: { url: string };
  isActive: boolean;
}

const AVATAR_COLORS = ["#0b84d8", "#c2410c", "#7c3aed", "#15803d", "#be185d", "#0f766e", "#b45309", "#4338ca"];
const colorOf = (s: string) => AVATAR_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const GoogleG = () => (
  <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.5 13.2l7.9 6.1C12.3 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
    <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.5 10.8l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

const Review = ({ t }: { t: ITestimonial }) => {
  const rating = t.rating || 5;
  const img = t.imgSrc || t.image?.url;
  return (
    <div className="flex h-full flex-col">
      {/* Avatar + name + rating */}
      <div className="mb-3 flex items-center gap-3">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={t.name} className="h-14 w-14 shrink-0 rounded-full object-cover sm:h-16 sm:w-16" />
        ) : (
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-medium text-white sm:h-16 sm:w-16 sm:text-3xl"
            style={{ background: colorOf(t.name || "A") }}
          >
            {(t.name || "A").trim().charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{t.name}</p>
          <div className="mt-0.5 flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <RiStarFill key={i} size={14} className={i < rating ? "text-amber-400" : "text-slate-300"} />
            ))}
            <span className="ml-1 text-xs font-medium text-slate-600">{rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="flex flex-1 flex-col rounded-2xl border border-sky-100 bg-sky-50/80 p-5 shadow-sm">
        <div className="mb-3 flex items-start justify-between">
          <RiDoubleQuotesR size={34} className="text-sky-200" />
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow">
            <GoogleG />
          </span>
        </div>
        <p className="flex-1 text-sm leading-6 text-slate-700 line-clamp-6">{t.feedback}</p>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <RiCheckboxCircleLine size={14} /> Verified Customer
        </p>
      </div>
    </div>
  );
};

export const TestimonialCard = () => {
  const [data, setData] = useState<ITestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef<SwiperType | null>(null);

  useEffect(() => {
    testimonialService
      .getAll()
      .then((r: any) => setData(r?.testimonials?.filter((i: ITestimonial) => i.isActive) || []))
      .catch((e: unknown) => console.error("Error fetching testimonials:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-slate-50 py-16">
        <div className="mx-auto h-48 max-w-[1100px] animate-pulse rounded-2xl bg-sky-50" />
      </section>
    );
  }
  if (!data.length) return null;

  const navBtn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95";

  return (
    <section className="bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-[#0b3b5c] sm:text-4xl">Your Reviews Fuel Us!</h2>
            <p className="mt-1 text-sm text-slate-700">
              Hear from happy customers whose special moments were made brighter with PrintHutt gifts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Previous" onClick={() => swiperRef.current?.slidePrev()} className={navBtn}>
              <RiArrowLeftLine size={18} />
            </button>
            <Link href="/about-us" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100">
              View all
            </Link>
            <button aria-label="Next" onClick={() => swiperRef.current?.slideNext()} className={navBtn}>
              <RiArrowRightLine size={18} />
            </button>
          </div>
        </div>

        <Swiper
          modules={[Autoplay]}
          onSwiper={(s) => (swiperRef.current = s)}
          autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
          loop={data.length > 4}
          spaceBetween={20}
          slidesPerView={1.15}
          breakpoints={{
            560: { slidesPerView: 2 },
            900: { slidesPerView: 3 },
            1100: { slidesPerView: 3.6 },
          }}
          className="!items-stretch"
        >
          {data.map((t) => (
            <SwiperSlide key={t._id} className="!h-auto">
              <Review t={t} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};
