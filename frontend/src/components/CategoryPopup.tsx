"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { RiCloseLine, RiSearch2Line, RiArrowRightSLine, RiAppsLine } from "react-icons/ri";

interface SubCategory {
  name: string;
  slug: string;
  image?: { url: string };
  totalProducts?: number;
  productCount?: number;
}

interface Category {
  _id?: string;
  name: string;
  slug: string;
  subcategories: SubCategory[];
  image?: { url: string };
  totalProducts?: number;
}

interface PopupProps {
  onClose: () => void;
  category: Category[];
}

const CategoryPopup = ({ onClose, category }: PopupProps) => {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(
    category?.[0] || null
  );
  const [query, setQuery] = useState("");

  /* ── Outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  /* ── ESC to close + body scroll lock ── */
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  /* ── Filtering ── */
  const filteredCategories = useMemo(() => {
    if (!query.trim()) return category;
    return category.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [category, query]);

  const filteredSubs = useMemo(() => {
    if (!activeCategory) return [];
    if (!query.trim()) return activeCategory.subcategories || [];
    return (activeCategory.subcategories || []).filter((s) =>
      s.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [activeCategory, query]);

  /* When filtered categories change, auto-select first if active gets filtered out */
  useEffect(() => {
    if (!activeCategory) return;
    if (!filteredCategories.find((c) => c.slug === activeCategory.slug)) {
      setActiveCategory(filteredCategories[0] || null);
    }
  }, [filteredCategories, activeCategory]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-5">
      {/* Overlay with subtle blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Popup */}
      <div
        ref={popupRef}
        className="relative z-10 w-full max-w-[1200px] h-[95vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >

        {/* ─── HEADER ─── */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#f5f7ff] flex items-center justify-center">
              <RiAppsLine className="w-5 h-5 text-[#6c7fd8]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                Explore Categories
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                Browse all categories & subcategories
              </p>
            </div>
          </div>

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories or subcategories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#6c7fd8] focus:outline-none transition"
            />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-500 hover:text-white text-gray-600 transition-colors flex items-center justify-center flex-shrink-0"
            aria-label="Close"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Mobile search ─── */}
        <div className="md:hidden px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <RiSearch2Line className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#6c7fd8] focus:outline-none"
            />
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* LEFT SIDEBAR */}
          <div className="lg:w-[280px] w-full lg:border-r border-b lg:border-b-0 border-gray-100 bg-gradient-to-b from-gray-50 to-white overflow-x-auto lg:overflow-y-auto">
            <div className="flex lg:flex-col gap-1.5 p-3 sm:p-4 min-w-max lg:min-w-0">

              {filteredCategories && filteredCategories.length > 0 ? (
                filteredCategories.map((cat, index) => {
                  const active = activeCategory?.slug === cat.slug;
                  return (
                    <button
                      key={index}
                      onMouseEnter={() => setActiveCategory(cat)}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200 whitespace-nowrap min-w-fit lg:w-full ${
                        active
                          ? "bg-[#6c7fd8] text-white shadow-md shadow-[#6c7fd8]/30"
                          : "text-gray-700 hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      {/* Category thumbnail */}
                      <div className={`w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 ${
                        active ? "bg-white/20" : "bg-gray-100"
                      }`}>
                        {cat.image?.url ? (
                          <Image
                            src={cat.image.url}
                            alt={cat.name}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${
                            active ? "text-white" : "text-gray-400"
                          }`}>
                            {cat.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>

                      <span className="text-[13px] sm:text-[14px] font-medium capitalize flex-1">
                        {cat.name.toLowerCase()}
                      </span>

                      {cat.subcategories?.length > 0 && (
                        <span className={`hidden lg:inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}>
                          {cat.subcategories.length}
                        </span>
                      )}

                      <RiArrowRightSLine
                        className={`w-4 h-4 hidden lg:block transition-transform ${
                          active ? "translate-x-0.5" : "opacity-40"
                        }`}
                      />
                    </button>
                  );
                })
              ) : query.trim() ? (
                <div className="p-4 text-center text-gray-400 text-sm w-full">
                  No category matches &quot;{query}&quot;
                </div>
              ) : (
                Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[44px] w-[140px] lg:w-full rounded-xl bg-gray-200 animate-pulse"
                  />
                ))
              )}
            </div>
          </div>

          {/* RIGHT SIDE — SUBCATEGORIES */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            {activeCategory ? (
              <>
                {/* Section heading */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight capitalize">
                      {activeCategory.name.toLowerCase()}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {filteredSubs.length}{" "}
                      {filteredSubs.length === 1 ? "subcategory" : "subcategories"}
                      {activeCategory.totalProducts
                        ? ` · ${activeCategory.totalProducts} products`
                        : ""}
                    </p>
                  </div>

                  <Link
                    href={`/category/${activeCategory.slug}`}
                    onClick={onClose}
                    className="w-fit flex items-center gap-1 px-4 py-2 rounded-full bg-[#f5f7ff] text-[#6c7fd8] text-sm font-semibold hover:bg-[#6c7fd8] hover:text-white transition-all"
                  >
                    View All
                    <RiArrowRightSLine className="w-4 h-4" />
                  </Link>
                </div>

                {/* Subcategory cards grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredSubs.length > 0 ? (
                    filteredSubs.map((sub, subIndex) => (
                      <Link
                        key={subIndex}
                        href={`/category/${activeCategory.slug}/${sub.slug}`}
                        onClick={onClose}
                        className="group flex flex-col items-center text-center gap-2 p-3 rounded-2xl border border-gray-100 bg-white hover:border-[#6c7fd8] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                          {sub.image?.url ? (
                            <Image
                              src={sub.image.url}
                              alt={sub.name}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold">
                              {sub.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="w-full">
                          <p className="text-[13px] font-medium text-gray-800 group-hover:text-[#6c7fd8] capitalize line-clamp-2 leading-tight">
                            {sub.name.toLowerCase()}
                          </p>
                          {(sub.totalProducts ?? sub.productCount) !== undefined &&
                            (sub.totalProducts ?? sub.productCount)! > 0 && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {sub.totalProducts ?? sub.productCount} items
                              </p>
                            )}
                        </div>
                      </Link>
                    ))
                  ) : query.trim() ? (
                    <div className="col-span-full text-center text-gray-400 py-12 text-sm">
                      No subcategory matches &quot;{query}&quot; in {activeCategory.name}
                    </div>
                  ) : (
                    <div className="col-span-full text-center text-gray-400 py-12 text-sm">
                      No subcategories yet
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Select a category
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPopup;