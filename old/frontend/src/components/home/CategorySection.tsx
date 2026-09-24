"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import { categoryService } from "@/_services/common/categoryService";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: {
    url: string;
  };
  totalProducts: number;
}

/* ─── Desktop Slider Settings ─── */
const sliderSettings = {
  dots: false,
  infinite: true,
  autoplay: false,
  speed: 400,
  slidesToShow: 9,
  slidesToScroll: 2,
  arrows: false,
  swipeToSlide: true,
  draggable: true,
  swipe: true,
  touchMove: true,
  responsive: [
    { breakpoint: 1400, settings: { slidesToShow: 8 } },
    { breakpoint: 1200, settings: { slidesToShow: 7 } },
    { breakpoint: 1024, settings: { slidesToShow: 6 } },
  ],
};

/* ─── Single Category Card ─── */
const CategoryCard = ({ category }: { category: Category }) => (
  <Link
    href={`/category/${category.slug}`}
    className="group flex flex-col items-center gap-[10px] outline-none"
    draggable={false}
  >
    {/* Image */}
    <div
      className={`
        w-full aspect-square
        rounded-[20px] md:rounded-[22px]
        overflow-hidden
        bg-[#f5f5f5]
        border border-[#ebebeb]
        transition-all duration-300
        group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)]
        group-hover:-translate-y-[3px]
        relative
      `}
    >
      <Image
        src={category?.image?.url || "/placeholder.jpg"}
        alt={category.name}
        fill
        sizes="(max-width: 640px) 25vw, (max-width: 1024px) 12vw, 10vw"
        draggable={false}
        className="object-cover select-none transition-transform duration-500 group-hover:scale-[1.05]"
      />
    </div>

    {/* Label */}
    <p
      className={`
        text-center
        text-[11px] sm:text-[12px] md:text-[13px]
        font-[500]
        text-[#1a1a1a]
        leading-[1.3]
        line-clamp-2
        w-full
        px-[2px]
      `}
    >
      {category.name}
    </p>
  </Link>
);

/* ─── Skeleton Loader ─── */
const SkeletonCard = () => (
  <div className="flex flex-col items-center gap-[10px] animate-pulse">
    <div className="w-full aspect-square rounded-[20px] bg-gray-200" />
    <div className="h-3 bg-gray-200 rounded w-3/4" />
  </div>
);

/* ─── Main Component ─── */
const CategorySection = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const sliderRef = useRef<Slider | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await categoryService.getAll("all");
        setCategories(response?.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <section className="py-[24px] md:py-[36px] bg-white">
        <div className="container mx-auto px-[14px] md:px-[20px]">

          {/* Header */}
          <div className="flex items-center justify-between mb-[18px] md:mb-[22px]">
            <div>
              <h2 className="text-[20px] md:text-[26px] font-bold text-[#111111] leading-tight">
                Trending Categories
              </h2>

              <p className="text-[12px] md:text-[13px] text-[#888] mt-[3px]">
                Explore popular collections
              </p>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => sliderRef.current?.slickPrev()}
                aria-label="Previous categories"
                className={`
                  w-10 h-10 rounded-full
                  bg-white
                  border border-[#e0e0e0]
                  flex items-center justify-center
                  text-[#333]
                  hover:bg-[#f5f5f5]
                  hover:border-[#ccc]
                  transition-all duration-200
                  shadow-sm
                `}
              >
                <RiArrowLeftSLine size={20} />
              </button>

              <button
                onClick={() => sliderRef.current?.slickNext()}
                aria-label="Next categories"
                className={`
                  w-10 h-10 rounded-full
                  bg-white
                  border border-[#e0e0e0]
                  flex items-center justify-center
                  text-[#333]
                  hover:bg-[#f5f5f5]
                  hover:border-[#ccc]
                  transition-all duration-200
                  shadow-sm
                `}
              >
                <RiArrowRightSLine size={20} />
              </button>
            </div>
          </div>

          {/* MOBILE GRID */}
          <div className="block md:hidden overflow-x-auto scrollbar-hide -mx-[14px] px-[14px]">
            {loading ? (
              <div
                className="grid gap-x-[12px] gap-y-[16px]"
                style={{
                  gridTemplateColumns:
                    "repeat(8, calc((100vw - 28px - 7 * 12px) / 4))",
                  gridTemplateRows: "repeat(2, auto)",
                  gridAutoFlow: "column",
                }}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div
                className="grid gap-x-[12px] gap-y-[16px] pb-[6px]"
                style={{
                  gridTemplateColumns: `repeat(${Math.ceil(
                    categories.length / 2
                  )}, calc((100vw - 28px - 3 * 12px) / 4))`,
                  gridTemplateRows: "repeat(2, auto)",
                  gridAutoFlow: "column",
                }}
              >
                {categories.map((category) => (
                  <CategoryCard
                    key={category._id}
                    category={category}
                  />
                ))}
              </div>
            )}
          </div>

          {/* DESKTOP SLIDER */}
          <div className="hidden md:block">
            {loading ? (
              <div className="grid grid-cols-9 gap-[10px]">
                {Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <Slider ref={sliderRef} {...sliderSettings}>
                {categories.map((category) => (
                  <div key={category._id} className="px-[6px]">
                    <CategoryCard category={category} />
                  </div>
                ))}
              </Slider>
            )}
          </div>
        </div>
      </section>

      {/* Scrollbar Hide */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default CategorySection;