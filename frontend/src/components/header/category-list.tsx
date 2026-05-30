'use client';

import Link from "next/link";
import Image from "next/image";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

interface SubCategory {
  name: string;
  slug: string;
  image?: { url: string };
}

interface Category {
  _id?: string;
  name: string;
  slug: string;
  subcategories: SubCategory[];
}

interface Props {
  categories: Category[];
}

const HeaderCategoryList = ({ categories }: Props) => {
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ left: number; top: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* ───── scroll arrows visibility ───── */
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  const scrollBy = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  /* ───── hover handlers with grace timeout ───── */
  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openDropdown = useCallback((category: Category) => {
    cancelClose();
    if (!category.subcategories?.length) return;

    const el = itemRefs.current.get(category.slug);
    if (!el) return;
    const rect = el.getBoundingClientRect();

    setActiveCategory(category);
    setDropdownPos({
      left: rect.left,
      top: rect.bottom,
    });
  }, []);

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setActiveCategory(null);
      setDropdownPos(null);
    }, 150);  // grace period so user can move mouse to dropdown
  };

  /* Close dropdown on scroll (position becomes stale) */
  useEffect(() => {
    const onScroll = () => {
      setActiveCategory(null);
      setDropdownPos(null);
    };
    const el = scrollRef.current;
    el?.addEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll);
    return () => {
      el?.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!categories?.length) return null;

  return (
    <>
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scrollBy('left')}
            className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-[#eee] rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50"
            aria-label="Scroll left"
          >
            <RiArrowLeftSLine size={18} />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scrollBy('right')}
            className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-[#eee] rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50"
            aria-label="Scroll right"
          >
            <RiArrowRightSLine size={18} />
          </button>
        )}

        {/* Scrollable strip */}
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto scroll-smooth scrollbar-hide py-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {categories.slice(0, 15).map((category, index) => (
            <div
              key={category._id || index}
              ref={(el) => itemRefs.current.set(category.slug, el)}
              className="flex-shrink-0"
              onMouseEnter={() => openDropdown(category)}
              onMouseLeave={scheduleClose}
            >
              <Link
                href={`/category/${category.slug}`}
                className={`flex items-center gap-1 px-4 py-3 text-[14px] font-medium whitespace-nowrap capitalize transition-colors ${
                  activeCategory?.slug === category.slug
                    ? 'text-[#6c7fd8]'
                    : 'text-[#3d4750] hover:text-[#6c7fd8]'
                }`}
              >
                {category.name.toLowerCase()}

                {category.subcategories?.length > 0 && (
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      activeCategory?.slug === category.slug ? 'rotate-180' : ''
                    }`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </Link>
            </div>
          ))}
        </div>

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
      </div>

      {/* ─── DROPDOWN — rendered outside scrollable container (fixed position) ─── */}
      {activeCategory && dropdownPos && activeCategory.subcategories?.length > 0 && (
        <div
          className="fixed z-[9999]"
          style={{ left: `${dropdownPos.left}px`, top: `${dropdownPos.top}px` }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="pt-2">
            <div className="min-w-[300px] max-w-[360px] bg-white border border-[#eee] rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.08)] overflow-hidden">

              {/* Header */}
              <div className="px-4 py-3 border-b border-[#f1f1f1] bg-[#fafafa] flex items-center justify-between">
                <h4 className="text-[14px] font-semibold text-[#3d4750] capitalize">
                  {activeCategory.name.toLowerCase()}
                </h4>
                <Link
                  href={`/category/${activeCategory.slug}`}
                  className="text-[12px] text-[#6c7fd8] hover:underline"
                  onClick={() => {
                    setActiveCategory(null);
                    setDropdownPos(null);
                  }}
                >
                  View All →
                </Link>
              </div>

              {/* Subcategories */}
              <div className="p-2 max-h-[420px] overflow-y-auto">
                <div className="space-y-1">
                  {activeCategory.subcategories.map((sub, i) => (
                    <Link
                      key={i}
                      href={`/category/${activeCategory.slug}/${sub.slug}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-[#686e7d] hover:bg-[#f5f7ff] hover:text-[#6c7fd8] transition-colors"
                      onClick={() => {
                        setActiveCategory(null);
                        setDropdownPos(null);
                      }}
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-[#eee] flex-shrink-0">
                        {sub.image?.url ? (
                          <Image
                            src={sub.image.url}
                            alt={sub.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                        )}
                      </div>
                      <span className="capitalize flex-1">{sub.name.toLowerCase()}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderCategoryList;