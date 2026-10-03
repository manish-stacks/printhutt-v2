"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { RiArrowRightLine, RiVolumeMuteLine, RiVolumeUpLine } from "react-icons/ri";
import { personalizedGiftService } from "@/_services/common/personalizedGiftService";

/* "Watch and Shop" style reel card — video/image (9:16) + neeche white strip (naam + CTA) */
const ytIdOf = (u = "") => u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i)?.[1];

const Card = ({ p }: { p: any }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const isYoutube = p?.type === "youtube";
  const yid = isYoutube ? ytIdOf(p?.videoUrl) : undefined;
  const isVideo = p?.type === "video";
  const src = isYoutube ? undefined : (isVideo ? (p?.videoUrl || p?.media?.url) : p?.media?.url);

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
        {isYoutube ? (
          <>
            {!ready && <div className="absolute inset-0 animate-pulse bg-neutral-800" />}
            {near && yid && (
              <iframe
                title={p?.name || "Video"}
                src={`https://www.youtube-nocookie.com/embed/${yid}?autoplay=1&mute=1&loop=1&playlist=${yid}&controls=0&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`}
                allow="autoplay; encrypted-media; picture-in-picture"
                loading="lazy"
                onLoad={() => setReady(true)}
                className={`pointer-events-none absolute left-1/2 top-0 h-full aspect-video -translate-x-1/2 border-0 transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
              />
            )}
          </>
        ) : isVideo ? (
          <>
            {!ready && <div className="absolute inset-0 animate-pulse bg-neutral-800" />}
            {near && (
              <video
                ref={vidRef}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
                loop muted={muted} playsInline autoPlay preload="metadata"
                onLoadedData={() => setReady(true)}
              >
                <source src={src} type="video/mp4" />
              </video>
            )}
            {/* <button
              type="button"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={() => setMuted((m) => !m)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/70"
            >
              {muted ? <RiVolumeMuteLine size={16} /> : <RiVolumeUpLine size={16} />}
            </button> */}
          </>
        ) : (
          src && <Image src={src} alt={p?.name || "Gift"} fill sizes="(max-width:768px) 60vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
        {p?.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold text-black shadow">{p.badge}</span>
        )}
      </div>

      <Link
        href={p?.link || "#"}
        className="absolute inset-x-2 bottom-2 flex items-center gap-3 rounded-lg bg-white p-2.5 shadow-lg transition hover:shadow-xl"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold leading-tight text-neutral-800">{p?.name}</span>
          <span className="mt-0.5 block text-[11px] text-neutral-500">Personalized Premium Gift</span>
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition group-hover:bg-amber-400 group-hover:text-black">
          <RiArrowRightLine size={16} />
        </span>
      </Link>
    </div>
  );
};

export default function GiftReelSlider({
  category, title, subtitle, dark = false,
}: { category: "Customized" | "Personalized"; title: string; subtitle?: string; dark?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    personalizedGiftService.getAll(category)
      .then((r: any) => alive && setItems(r?.data || []))
      .catch(console.error)
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [category]);

  const font = { fontFamily: "'Cormorant Garamond', serif" };

  return (
    <section className={`${dark ? "bg-[#111128]" : "bg-white"} py-10 sm:py-14`}>
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div className="mb-6 text-center sm:mb-9">
          <h2 className={`text-2xl font-bold leading-tight sm:text-5xl ${dark ? "text-white" : "text-[#0d0d1a]"}`} style={font}>
            {title}
          </h2>
          {subtitle && (
            <p className={`mx-auto mt-3 hidden max-w-2xl text-sm leading-relaxed sm:block sm:text-base ${dark ? "text-white/60" : "text-[#0d0d1a]/60"}`}>
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-[18px] xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="aspect-[9/16] animate-pulse rounded-xl bg-black/10" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-[18px] xl:grid-cols-5">
              {items.map((p, i) => (
                <Card key={p?._id || i} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
