"use client";
import React, { useEffect } from "react";
import CategoryHome from "@/components/home/CategoryHome";
// import Testimonials from "@/components/Testimonials";
// import NewProductArea from "@/components/NewProductArea";
import OurServices from "@/components/OurServices";
import HeroSlider from "@/components/home/HeroSlider";
// import BannerOne from "@/components/home/BannerOne";
// import confetti from "canvas-confetti";
import { v4 as uuidv4 } from "uuid";
// import AcrylicPhotoVideo from "@/components/home/AcrylicPhotoVideo";
import PersonalizedGifts from "@/components/home/PersonalisedGifts";
import PersonalizedGiftsTwo from "@/components/home/PersonalisedGiftsTwo";
import DayoftheWeek from "@/components/home/DayoftheDeal";
import { TestimonialCard } from "@/components/TestimonialCard";
import AcrylicPhotoVideoSlider from "@/components/home/AcrylicPhotoVideoSlider";
// import TrendingCategoryReels from "@/components/home/TrendingCategoryReels";
import { categoryService } from "@/_services/common/categoryService";
import CategorySection from "@/components/home/CategorySection";
// import { MapArea } from "@/components/home/MapArea";
// import AcrylicPhotoVideo from "@/components/home/AcrylicPhotoVideo";
// import { MapArea } from "@/components/home/MapArea";
// import ImageModal from "@/components/ImageModal";
// import RakshaBandhanCelebration from "@/components/RakshaBandhanConfetti";
// import Fireworks from "@/components/Fireworks";
// import FireworksFancy from "@/components/Fireworks";
// import { motion } from "framer-motion";
// import RakshaBandhanConfetti from "@/components/RakshaBandhanConfetti";

const HomeComponent = () => {

  const [category, setCategory] = React.useState<any>(null);

  const triggerConfetti = async () => {
    try {
      const res = await categoryService.getFeaturedCategories();

      setCategory(res.categories);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    const storedSessionId = localStorage.getItem("session_id");
    const sessionExpiresAt = localStorage.getItem("session_expires_at");

    const currentTime = Date.now();

    if (!storedSessionId || !sessionExpiresAt || currentTime > sessionExpiresAt) {

      const newSessionId = uuidv4();
      const expiresAt = currentTime + 3 * 60 * 60 * 1000;

      localStorage.setItem("session_id", newSessionId);
      localStorage.setItem("session_expires_at", expiresAt);

      console.log("New session created:", newSessionId);
    } else {
      console.log("Existing session found:", storedSessionId);
    }
    triggerConfetti();

  }, []);



  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasVisited = localStorage.getItem("hasVisitedBefore");
      if (!hasVisited) {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("hasVisitedBefore", "true");
        console.log("First time visit — reset done.");
      }
    }
  }, []);

  return (
    <>

      <HeroSlider />
      <CategorySection />
      <CategoryHome />
      <AcrylicPhotoVideoSlider />
      {/* <AcrylicPhotoVideo /> */}
      <PersonalizedGifts />
      <PersonalizedGiftsTwo />
      <DayoftheWeek title={'New Arrival'} catID={'new-arrival'} />
      {
        category && category.map((cat: any) => (
          <DayoftheWeek key={cat._id} title={cat.name} catID={cat._id} />
        ))
      }
    
      {/* <NewProductArea /> */}
      {/* <BannerOne /> */}

      <TestimonialCard />
      <OurServices />

    </>
  );
};

export default HomeComponent;

