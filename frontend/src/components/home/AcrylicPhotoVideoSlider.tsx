"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { RiArrowLeftSLine, RiArrowRightSLine, RiVolumeMuteLine, RiVolumeUpLine } from "react-icons/ri";
import { productService } from "@/_services/common/productService";
import { effectivePricing } from "@/lib/pricing";
import { formatCurrency } from "@/helpers/helpers";
import "swiper/css";

const videos = [
  {
    url: "/product-details/customized-wall-photo-frame-acrylic-acrylic-photo-frame",
    video: "https://cloudify.printhutt.com/video/WhatsApp_Video_2025-03-01_at_9.11.26_PM_online-video-cutter.com_1_yq8a8p.mp4",
    title: "Acrylic Frame",
  },
  {
    url: "/product-details/customize-acrylic-full-photo-frame-a4-size",
    video: "https://cloudify.printhutt.com/video/WhatsApp_Video_2025-03-01_at_11.58.10_AM_iyvpqf.mp4",
    title: "LED Photo Frame",
  },
  {
    url: "/product-details/led-photo-rolling-dice",
    video: "https://cloudify.printhutt.com/video/WhatsApp%20Video%202025-03-22%20at%206.10.05%20PM.mp4",
    title: "LED Dice",
  },
  {
    url: "/product-details/led-acrylic-heart-frameee",
    video: "https://cloudify.printhutt.com/video/20260717_161412.mp4",
    title: "Acrylic Heart",
  },
  {
    url: "/product-details/customized-name-led-lamp",
    video: "https://cloudify.printhutt.com/video/WhatsApp_Video_2025-03-01_at_11.41.08_AM_aeu7jl.mp4",
    title: "Name LED Lamp",
  },
  {
    url: "/product-details/personalized-acrylic-cutout-photo-led-lamp",
    video: "https://cloudify.printhutt.com/video/WhatsApp_Video_2025-03-01_at_6.03.50_PM_l0wwwy.mp4",
    title: "Cutout Lamp",
  },
  {
    url: "/product-details/acrylic-photo-puzzles",
    video: "https://cloudify.printhutt.com/video/Puzzles.mp4",
    title: "Photo Puzzles",
  },
  {
    url: "/product-details/hanging-lamp",
    video: "https://cloudify.printhutt.com/video/hanging-lamp.mp4",
    title: "Hanging Lamp",
  },
  
];

type Info = { title?: string; thumb?: string; final?: number; mrp?: number; off?: boolean };

const slugOf = (url: string) => url.split("/").pop() || "";

/* Reel card: video (tap = sound on/off) + neeche white product strip (thumb, title, price) */
const ReelCard = ({ video, title, url, info }: { video: string; title: string; url: string; info?: Info }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);

  // Sirf viewport ke paas load, aur screen se bahar jaate hi pause (battery + data bachta hai)
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
        const v = vidRef.current;
        if (!v) return;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "150px", threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="group relative overflow-hidden rounded-xl bg-neutral-900 shadow-[0_6px_20px_-8px_rgba(0,0,0,.35)]">
      <div ref={boxRef} className="relative aspect-[9/16] w-full bg-neutral-800">
        {!ready && <div className="absolute inset-0 animate-pulse bg-neutral-800" />}
        {near && (
          <video
            ref={vidRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
            loop muted={muted} playsInline autoPlay preload="metadata"
            onLoadedData={() => setReady(true)}
          >
            <source src={video} type="video/mp4" />
          </video>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
        {/* <button
          type="button"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => setMuted((m) => !m)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/70"
        >
          {muted ? <RiVolumeMuteLine size={16} /> : <RiVolumeUpLine size={16} />}
        </button> */}
      </div>

      {/* Product strip */}
      <Link
        href={url}
        className="absolute inset-x-2 bottom-2 flex items-center gap-3 rounded-lg bg-white p-2 shadow-lg transition hover:shadow-xl"
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-neutral-100">
          {info?.thumb && <Image src={info.thumb} alt={info.title || title} fill sizes="56px" className="object-cover" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium leading-tight text-neutral-800">{info?.title || title}</span>
          {info?.final ? (
            <span className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[15px] font-bold text-neutral-900">{formatCurrency(info.final)}</span>
              {info.off && <span className="text-xs text-neutral-400 line-through">{formatCurrency(info.mrp || 0)}</span>}
            </span>
          ) : (
            <span className="mt-1 block text-xs font-semibold text-amber-600">Shop now →</span>
          )}
        </span>
      </Link>
    </div>
  );
};

const InstagramStyleVideoGrid = () => {
  const [infos, setInfos] = useState<Record<string, Info>>({});
  const swiperRef = useRef<SwiperType | null>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  // Product ka real thumbnail + price (fail ho to sirf title dikhega)
  useEffect(() => {
    let alive = true;
    Promise.all(
      videos.map(async (v) => {
        try {
          const r: any = await productService.getBySlug(slugOf(v.url));
          const p = r?.product || r;
          if (!p?._id) return null;
          const pr = effectivePricing(p, null);
          return [v.url, { title: p.title, thumb: p.thumbnail?.url, final: pr.final, mrp: pr.mrp, off: pr.hasDiscount }] as const;
        } catch {
          return null;
        }
      })
    ).then((rows) => {
      if (!alive) return;
      setInfos(Object.fromEntries(rows.filter(Boolean) as [string, Info][]));
    });
    return () => { alive = false; };
  }, []);

  const arrow = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-800 shadow-md ring-1 ring-black/5 transition hover:bg-neutral-100 disabled:opacity-0 md:flex";

  return (
    <section className="bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <h2 className="mb-6 text-center text-2xl font-extrabold uppercase tracking-wide text-neutral-900 sm:mb-9 sm:text-3xl">
          Watch and Shop
        </h2>

        <div className="relative">
          <button aria-label="Previous" disabled={edge.start} onClick={() => swiperRef.current?.slidePrev()} className={`${arrow} -left-4`}>
            <RiArrowLeftSLine size={22} />
          </button>
          <button aria-label="Next" disabled={edge.end} onClick={() => swiperRef.current?.slideNext()} className={`${arrow} -right-4`}>
            <RiArrowRightSLine size={22} />
          </button>

          <Swiper
            onSwiper={(s) => (swiperRef.current = s)}
            onSlideChange={(s) => setEdge({ start: s.isBeginning, end: s.isEnd })}
            spaceBetween={14}
            slidesPerView={1.6}
            breakpoints={{
              480: { slidesPerView: 2.3 },
              768: { slidesPerView: 3.3 },
              1024: { slidesPerView: 4.3, spaceBetween: 18 },
              1280: { slidesPerView: 5, spaceBetween: 18 },
            }}
          >
            {videos.map((v) => (
              <SwiperSlide key={v.url}>
                <ReelCard video={v.video} title={v.title} url={v.url} info={infos[v.url]} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default InstagramStyleVideoGrid;
