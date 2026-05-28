"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import "swiper/css";
import "swiper/css/navigation";

interface SubCategory {
    _id: string;
    name: string;
    slug: string;
    image: {
        url: string;
    };
    productCount?: number;
}

interface Props {
    slug: string;
    categories: SubCategory[];
    loading: boolean;
}

/* ─── Single Category Card ─── */
const CategoryCard = ({
    parentSlug,
    category,
}: {
    parentSlug: string;
    category: SubCategory;
}) => (
    <Link
        href={`/category/${parentSlug}/${category.slug}`}
        className="group flex flex-col items-center gap-[10px] outline-none"
        draggable={false}
    >
        {/* Image */}
        <div
            className="
        w-full aspect-square
        rounded-[20px] md:rounded-[22px]
        overflow-hidden
        bg-[#f5f5f5]
        border border-[#ebebeb]
        transition-all duration-300
        group-hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)]
        group-hover:-translate-y-[3px]
        relative
      "
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
        <div className="w-full text-center px-[2px]">
            <p className="text-[11px] sm:text-[12px] md:text-[13px] font-[500] text-[#1a1a1a] leading-[1.3] line-clamp-2 capitalize">
                {category.name}
            </p>
            {
                category?.productCount && category?.productCount > 0 && (
                    <p className="text-[10px] sm:text-[11px] text-[#888] mt-[1px]">
                        {category?.productCount ?? 0} items
                    </p>
                )
            }
        </div>
    </Link>
);

/* ─── Skeleton Loader ─── */
const SkeletonCard = () => (
    <div className="flex flex-col items-center gap-[10px] animate-pulse">
        <div className="w-full aspect-square rounded-[20px] bg-gray-200" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-200 rounded w-1/2" />
    </div>
);

/* ─── Main Component ─── */
const SubCategorySection = ({ slug, categories = [], loading = false }: Props) => {
    const swiperRef = useRef<SwiperType | null>(null);

    /* Neon special banner — unchanged behaviour */
    if (slug === "neon") {
        return (
            <section className="py-[24px] md:py-[36px] bg-white">
                <div className="container mx-auto px-[14px] md:px-[20px]">
                    <Link href={`/product/customize-neon-sign`}>
                        <Image
                            className="w-full object-cover rounded-[20px] h-[300px]"
                            alt="category-banner"
                            width={1294}
                            height={150}
                            src="https://s3.ap-south-1.amazonaws.com/printhutt.dev.bucket/others/neon.png"
                        />
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="py-[24px] md:py-[36px] bg-white">
            <div className="container mx-auto px-[14px] md:px-[2px] max-w-7xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-[18px] md:mb-[22px]">
                    <div>
                        <h2 className="text-[20px] md:text-[26px] font-bold text-[#111111] leading-tight capitalize">
                            {slug} Categories
                        </h2>
                        <p className="text-[12px] md:text-[13px] text-[#888] mt-[3px]">
                            Explore popular collections
                        </p>
                    </div>

                    {/* Desktop Nav */}
                    {!loading && categories?.length >= 2 && (
                        <div className="hidden md:flex items-center gap-4">
                            <button
                                onClick={() => swiperRef.current?.slidePrev()}
                                aria-label="Previous categories"
                                className="w-10 h-10 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center text-[#333] hover:bg-[#f5f5f5] hover:border-[#ccc] transition-all duration-200 shadow-sm"
                            >
                                <RiArrowLeftSLine size={20} />
                            </button>
                            <button
                                onClick={() => swiperRef.current?.slideNext()}
                                aria-label="Next categories"
                                className="w-10 h-10 rounded-full bg-white border border-[#e0e0e0] flex items-center justify-center text-[#333] hover:bg-[#f5f5f5] hover:border-[#ccc] transition-all duration-200 shadow-sm"
                            >
                                <RiArrowRightSLine size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {/* MOBILE GRID */}
                <div className="block md:hidden overflow-x-auto scrollbar-hide -mx-[14px] px-[14px]">
                    {loading ? (
                        <div className="grid grid-cols-4 gap-x-[12px] gap-y-[16px]">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-4 gap-x-[12px] gap-y-[16px] pb-[6px]">
                            {categories?.map((category) => (
                                <CategoryCard
                                    key={category._id}
                                    parentSlug={slug}
                                    category={category}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* DESKTOP SWIPER */}
                <div className="hidden md:block">
                    {loading ? (
                        <div className="grid grid-cols-9 gap-[10px]">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : (
                        categories?.length >= 1 && (
                            <Swiper
                                modules={[Navigation]}
                                onSwiper={(sw) => (swiperRef.current = sw)}
                                spaceBetween={12}
                                slidesPerView={9}
                                slidesPerGroup={2}
                                breakpoints={{
                                    1024: { slidesPerView: 6 },
                                    1200: { slidesPerView: 7 },
                                    1400: { slidesPerView: 8 },
                                    1600: { slidesPerView: 9 },
                                }}
                                className="category-slider"
                            >
                                {categories?.map((category) => (
                                    <SwiperSlide key={category._id}>
                                        <CategoryCard parentSlug={slug} category={category} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        )
                    )}
                </div>
            </div>

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
        </section>
    );
};

export default SubCategorySection;