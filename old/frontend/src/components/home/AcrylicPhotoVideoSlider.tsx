"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { RiInstagramLine } from "react-icons/ri";
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


const LazyVideoCard = ({ video, title, url }: { video: string; title: string; url: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); 
        }
      },
      {
        rootMargin: "200px", 
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

 
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVisible) return;

    const onCanPlay = () => {
      setIsLoaded(true);
      v.play().catch(() => {}); 
    };

    v.addEventListener("canplaythrough", onCanPlay);
    return () => v.removeEventListener("canplaythrough", onCanPlay);
  }, [isVisible]);

  return (
    <Link href={url} className="group block">
      <div className="relative overflow-hidden rounded-[12px] border border-white/10 bg-[#13132a] hover:border-amber-400/40 transition-all duration-500 shadow-xl hover:shadow-amber-400/10 hover:-translate-y-2">
        <div ref={containerRef} className="relative aspect-[0.9/1.5] overflow-hidden bg-[#13132a]">

          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-amber-400 animate-spin" />
            </div>
          )}

         
          {isVisible && (
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isLoaded ? "opacity-100" : "opacity-0"}`}
              loop
              muted
              playsInline
            >
              <source src={video} type="video/mp4" />
            </video>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-transparent to-transparent" />

          {/* Bottom label */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-white/40 text-xs mt-1">Watch Product Reel</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <RiInstagramLine size={18} className="text-pink-400" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
};

// ─── Main section ─────────────────────────────────────────────────────────────
const InstagramStyleVideoGrid = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <section className="bg-[#0d0d1a] py-14">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="w-44 h-8 bg-white/10 rounded-full mx-auto animate-pulse mb-4" />
            <div className="w-72 h-12 bg-white/10 rounded-xl mx-auto animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] min-w-[240px] rounded-3xl bg-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#0d0d1a] py-14 sm:py-16">

      {/* Glow */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-pink-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-400/10 blur-3xl rounded-full" />

      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6">

      
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-300 text-[11px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-full mb-4">
            <RiInstagramLine size={14} />
            Trending Reels
          </span>
          <h2
            className="text-3xl sm:text-5xl text-white font-bold leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Watch Our Products Glow
          </h2>
          <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
            Explore real customer videos, premium neon signs,
            personalized gifts and glowing memories crafted with love.
          </p>
        </div>

        
        <Swiper
          modules={[Autoplay]}
          spaceBetween={18}
          slidesPerView={1.3}
          autoplay={{
            delay: 2800,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          loop
          speed={700}
          breakpoints={{
            480: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            1024: { slidesPerView: 4.2 },
            1280: { slidesPerView: 5 },
          }}
        >
          {videos.map((v, index) => (
            <SwiperSlide key={index}>
              <LazyVideoCard video={v.video} title={v.title} url={v.url} />
            </SwiperSlide>
          ))}
        </Swiper>

      </div>
    </section>
  );
};

export default InstagramStyleVideoGrid;