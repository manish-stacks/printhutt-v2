"use client";

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';

const AcrylicPhotoVideo = () => {
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
      { rootMargin: "150px", threshold: 0 }
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
    <section className="section-banner-one overflow-hidden py-[50px] max-[1199px]:py-[35px] bg-[rgb(14,16,47,1)]">
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 px-6 lg:px-16 py-1 max-w-7xl mx-auto">

        <div ref={containerRef} className="w-full lg:w-1/2 relative">

          {/* Skeleton */}
          {!isLoaded && (
            <div className="w-[450px] h-[450px] max-w-full rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-rose-400 animate-spin" />
            </div>
          )}

          {isVisible && (
            <video
              ref={videoRef}
              loop
              muted
              playsInline
              preload="none"
              className={`w-[450px] h-[450px] max-w-full rounded-xl shadow-lg object-cover object-center transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0 absolute top-0 left-0"}`}
              width="450"
              height="450"
            >
              <source
                src="https://cloudify.printhutt.com/video/WhatsApp_Video_2025-03-01_at_9.11.26_PM_online-video-cutter.com_1_yq8a8p.mp4"
                type="video/mp4"
              />
            </video>
          )}
        </div>

        {/* Right Side - Content */}
        <div className="w-full lg:w-1/2 text-center lg:text-left">
          <h2
            className="text-5xl font-bold text-slate-100 mb-4 max-[576px]:text-3xl py-2"
            style={{ fontFamily: 'Buttervill' }}
          >
            Acrylic Photo
          </h2>
          <p className="text-slate-200 text-lg leading-relaxed mb-6 hidden md:block">
            Showcase your loved ones in a striking way with the unique Clear
            Acrylic Photo. Featuring a personalized, people-only design where the
            background is removed, allowing your wall to seamlessly integrate
            through the transparent areas.
          </p>
          <Link
            href="/product-details/customized-wall-photo-frame-acrylic-acrylic-photo-frame"
            className="px-6 py-3 mt-2 text-lg font-medium bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-700 transition"
          >
            Shop Now
          </Link>
        </div>

      </div>
    </section>
  );
};

export default AcrylicPhotoVideo;