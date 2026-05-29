"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";

interface PopupProps {
  onClose: () => void;
  category: {
    name: string;
    slug: string;
    subcategories: {
      name: string;
      slug: string;
    }[];
  }[];
}

const CategoryPopup = ({
  onClose,
  category,
}: PopupProps) => {

  const popupRef =
    useRef<HTMLDivElement | null>(null);

  const [activeCategory, setActiveCategory] =
    useState(category?.[0] || null);

  const handleClickOutside = (
    event: MouseEvent
  ) => {

    if (
      popupRef.current &&
      !popupRef.current.contains(
        event.target as Node
      )
    ) {
      onClose();
    }

  };

  useEffect(() => {

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

    };

  }, []);

  return (

    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-[10px] sm:p-[20px]">

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#00000080]" />

      {/* Popup */}
      <div
        ref={popupRef}
        className="relative z-10 w-full max-w-[1150px] h-[95vh] overflow-hidden rounded-[18px] sm:rounded-[26px] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.12)] flex flex-col"
      >

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-[14px] right-[14px] sm:top-[18px] sm:right-[20px] w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] rounded-full bg-[#f4f4f4] hover:bg-[#6c7fd8] hover:text-white transition-all duration-300 flex items-center justify-center z-20 text-[14px]"
        >
          ✕
        </button>

        {/* Header */}
        <div className="px-[18px] sm:px-[35px] pt-[20px] sm:pt-[35px] pb-[16px] sm:pb-[20px] border-b border-[#f1f1f1]">

          <h2 className="text-[22px] sm:text-[28px] font-bold text-[#3d4750] leading-[1.2]">
            Explore Categories
          </h2>

          <p className="text-[13px] sm:text-[14px] text-[#888] mt-[4px]">
            Browse all categories & subcategories
          </p>

        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* LEFT SIDE */}
          <div className="lg:w-[280px] w-full lg:border-r border-b lg:border-b-0 border-[#f1f1f1] bg-[#fafafa] overflow-x-auto lg:overflow-y-auto">

            {/* MOBILE CATEGORY SCROLL */}
            <div className="flex lg:flex-col gap-[10px] p-[14px] sm:p-[18px] min-w-max lg:min-w-0">

              {category &&
                category.length > 0 ? (

                category.map(
                  (cat, index) => (

                    <button
                      key={index}
                      onMouseEnter={() =>
                        setActiveCategory(cat)
                      }
                      onClick={() =>
                        setActiveCategory(cat)
                      }
                      className={`flex items-center justify-between gap-[12px] rounded-[12px] sm:rounded-[14px] px-[14px] py-[12px] sm:px-[16px] sm:py-[14px] text-left transition-all duration-300 whitespace-nowrap min-w-fit lg:w-full
                      
                      ${activeCategory?.slug ===
                          cat.slug
                          ? "bg-[#6c7fd8] text-white shadow-md"
                          : "text-[#3d4750] hover:bg-[#eef1ff]"
                        }`}
                    >

                      <span className="text-[13px] sm:text-[14px] font-medium">
                        {cat.name}
                      </span>

                      <svg
                        className="w-[14px] h-[14px] hidden lg:block"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>

                    </button>
                  )
                )

              ) : (

                Array.from({ length: 8 }).map(
                  (_, index) => (

                    <div
                      key={index}
                      className="h-[44px] w-[140px] lg:w-full rounded-[12px] bg-gray-200 animate-pulse"
                    />

                  )
                )

              )}

            </div>

          </div>

          {/* RIGHT SIDE */}
          <div className="flex-1 overflow-y-auto p-[18px] sm:p-[30px]">

            {activeCategory ? (

              <>

                {/* Heading */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[14px] mb-[24px]">

                  <div>

                    <h3 className="text-[22px] sm:text-[26px] font-bold text-[#3d4750] leading-[1.2]">
                      {activeCategory.name}
                    </h3>

                    <p className="text-[13px] sm:text-[14px] text-[#888] mt-[4px]">
                      Explore premium collections
                    </p>

                  </div>

                  <Link
                    href={`/category/${activeCategory.slug}`}
                    className="w-fit px-[16px] py-[10px] rounded-full bg-[#f5f7ff] text-[#6c7fd8] text-[13px] font-semibold hover:bg-[#6c7fd8] hover:text-white transition-all duration-300"
                  >
                    View All
                  </Link>

                </div>

                {/* Subcategories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[12px] sm:gap-[16px]">

                  {activeCategory.subcategories &&
                    activeCategory.subcategories.length >
                    0 ? (

                    activeCategory.subcategories.map(
                      (
                        subCategory,
                        subIndex
                      ) => (

                        <Link
                          key={subIndex}
                          href={`/category/${activeCategory.slug}/${subCategory.slug}`}
                          className="group flex items-center justify-between rounded-[14px] sm:rounded-[16px] border border-[#f1f1f1] bg-white px-[16px] py-[16px] sm:px-[18px] sm:py-[18px] hover:border-[#6c7fd8] hover:bg-[#f8f9ff] transition-all duration-300"
                        >

                          <div className="flex items-center gap-3">

                            <img
                              src={subCategory?.image?.url || "/placeholder.jpg"}
                              alt={subCategory.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#eee]"
                            />

                            <span>
                              {subCategory.name}
                            </span>

                          </div>

                          <svg
                            className="w-[14px] h-[14px] text-[#bbb] group-hover:text-[#6c7fd8] group-hover:translate-x-[2px] transition-all duration-300"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>

                        </Link>
                      )
                    )

                  ) : (

                    Array.from({ length: 6 }).map(
                      (_, index) => (

                        <div
                          key={index}
                          className="h-[70px] rounded-[16px] bg-gray-200 animate-pulse"
                        />

                      )
                    )

                  )}

                </div>

              </>

            ) : (

              <div className="flex items-center justify-center h-full text-[#999] text-[14px]">
                No category found
              </div>

            )}

          </div>

        </div>

      </div>

    </div>

  );
};

export default CategoryPopup;
