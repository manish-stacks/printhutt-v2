"use client";
import React, { useEffect, useRef, useState } from "react";
import HeroSlider from "@/components/home/HeroSlider";
import CategorySection from "@/components/home/CategorySection";
import CategoryHome from "@/components/home/CategoryHome";
import AcrylicPhotoVideoSlider from "@/components/home/AcrylicPhotoVideoSlider";
import PersonalizedGifts from "@/components/home/PersonalisedGifts";
import PersonalizedGiftsTwo from "@/components/home/PersonalisedGiftsTwo";
import DayoftheWeek from "@/components/home/DayoftheDeal";
import { TestimonialCard } from "@/components/TestimonialCard";
import OurServices from "@/components/OurServices";
import { categoryService } from "@/_services/common/categoryService";

const LazySection = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" } 
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? children : (
        <div className="w-full h-[300px] bg-white" aria-hidden="true" />
      )}
    </div>
  );
};

// ─── Simple session ID without uuid package (saves 43 KiB legacy JS) ─────────
function getOrCreateSessionId(): string {
  try {
    const storedId = localStorage.getItem("session_id");
    const expiresAt = localStorage.getItem("session_expires_at");
    const now = Date.now();
    if (storedId && expiresAt && now < Number(expiresAt)) return storedId;

    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("session_id", newId);
    localStorage.setItem("session_expires_at", String(now + 3 * 60 * 60 * 1000));
    return newId;
  } catch {
    return "";
  }
}

const HomeComponent = () => {
  const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);

  useEffect(() => {
    getOrCreateSessionId();

    const hasVisited = localStorage.getItem("hasVisitedBefore");
    if (!hasVisited) {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem("hasVisitedBefore", "true");
    }

    const timer = setTimeout(async () => {
      try {
        const res = await categoryService.getFeaturedCategories();
        setFeaturedCategories(res.categories || []);
      } catch { /* silent */ }
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* ── ABOVE FOLD — immediately render ── */}
      <HeroSlider />
      <CategorySection />
      <CategoryHome />

      {/* ── BELOW FOLD — lazy render on scroll ── */}
      <LazySection>
        <AcrylicPhotoVideoSlider />
      </LazySection>

      <LazySection>
        <PersonalizedGifts />
      </LazySection>

      <LazySection>
        <PersonalizedGiftsTwo />
      </LazySection>

      <LazySection>
        <DayoftheWeek title="New Arrival" catID="new-arrival" />
      </LazySection>

      {featuredCategories.map((cat: any) => (
        <LazySection key={cat._id}>
          <DayoftheWeek title={cat.name} catID={cat._id} />
        </LazySection>
      ))}

      <LazySection>
        <TestimonialCard />
      </LazySection>

      <LazySection>
        <OurServices />
      </LazySection>
    </>
  );
};

export default HomeComponent;