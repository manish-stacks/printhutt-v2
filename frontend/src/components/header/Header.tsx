'use client'
import Link from "next/link";
import React, { Suspense, useEffect, useState } from "react";

import {
  RiCloseFill,
  RiFacebookFill,
  RiInstagramFill,
  RiLinkedinFill,
  RiMenu2Fill,
  RiMenu3Fill,
  RiTwitterFill,
  RiUser3Line,
  RiHeartLine,
  RiShoppingCart2Line,
  RiAppsLine,
} from "react-icons/ri";
import Image from "next/image";
import siteLogo from '/public/print-hutt-logo.webp';
import { useCartStore } from "@/store/useCartStore";
import { useUserStore } from "@/store/useUserStore";
import { categoryService } from "@/_services/common/categoryService";
import HeaderCategoryList from "./category-list";
import CategoryPopup from "../CategoryPopup";
import SearchBar from "./SearchBar";
import { wishlistService } from "@/_services/common/wishlist";
import useCartSidebarStore from "@/store/useCartSidebarStore";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleCategory = () => setIsOpen((prev) => !prev);
  const toggleClose = () => setIsOpen(false);
  const [isMobileMenu, setMobileMenu] = useState(false);
  const toggleMenu = () => setMobileMenu((prev) => !prev);
  const items = useCartStore((state) => state.items);
  const totalItem = items.length;
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [categoriesData, setCategoriesData] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const { openCartSidebarView } = useCartSidebarStore();
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [categories] = await Promise.all([
        categoryService.getAll("all"),
      ]);
      setCategoriesData(categories?.categories);
      const response = await wishlistService.getAll();
      setWishlistCount(response.data?.items?.length || 0);
    } catch (error) {
      setWishlistCount(0);
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const socialLinks = [
    { icon: RiFacebookFill, link: "https://www.facebook.com/print.hutt" },
    { icon: RiInstagramFill, link: "https://www.instagram.com/printhutt/" },
    { icon: RiTwitterFill, link: "https://twitter.com/printhutt" },
    { icon: RiLinkedinFill, link: "https://www.linkedin.com/company/print-hutt" },
  ];

  return (
    <>
      <header className="bb-header sticky top-0 z-[15] bg-white border-b border-[#eee] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

        {/* ─── TOP STRIP ─── */}
        <div className="bg-gradient-to-r from-[#1a1a3e] via-[#2d1b5e] to-[#3d2b6e] py-[8px] hidden md:block">
          <div className="mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] px-4">
            <div className="flex items-center justify-between text-white text-[13px]">

              {/* Left: marquee */}
              <div className="flex-1 overflow-hidden whitespace-nowrap">
                <div className="animate-marquee inline-block tracking-[0.02rem]">
                  ✨ 30% OFF · 12,000+ Items Delivered · 40 Years of Experience ·
                  Use code <strong className="text-yellow-300">FLAT100</strong> for ₹100 off on orders above ₹500
                </div>
              </div>

              {/* Right: links */}
              <div className="flex items-center gap-5 ml-6 flex-shrink-0">
                <span className="flex items-center gap-1 text-[12px] uppercase tracking-wider opacity-90">
                  🙏 Jai Balaji
                </span>
                <Link
                  href="/user/orders"
                  className="text-[12px] uppercase tracking-wider hover:text-yellow-300 transition-colors"
                >
                  Track Order
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MAIN BAR (logo + search + icons) ─── */}
        <div className="py-[14px] md:py-[16px]">
          <div className="mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] px-4">
            <div className="flex items-center justify-between gap-4">

              {/* LEFT: mobile menu + logo */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={toggleMenu}
                  className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100"
                  aria-label="Open menu"
                >
                  <RiMenu2Fill className="text-xl text-[#3d4750]" />
                </button>

                <Link href="/" className="flex items-center">
                  <Image
                    src={siteLogo}
                    alt="PrintHutt"
                    width={160}
                    height={50}
                    priority
                    className="w-[140px] md:w-[160px] h-auto"
                  />
                </Link>
              </div>

              {/* CENTER: search (desktop) */}
              <div className="hidden md:block flex-1 max-w-[640px] mx-6">
                <SearchBar />
              </div>

              {/* RIGHT: account + wishlist + cart */}
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">

                {/* Account */}
                <a
                  href={isLoggedIn ? '/user/dashboard' : '/login'}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  title="Account"
                >
                  <RiUser3Line className="w-6 h-6 text-[#6c7fd8]" />
                  <div className="hidden xl:flex flex-col leading-tight">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">Account</span>
                    <span className="text-[13px] font-semibold text-[#3d4750]">
                      {isLoggedIn ? 'Dashboard' : 'Login'}
                    </span>
                  </div>
                </a>

                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  className="relative flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  title="Wishlist"
                >
                  <div className="relative">
                    <RiHeartLine className="w-6 h-6 text-[#6c7fd8]" />

                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {wishlistCount}
                    </span>

                  </div>
                  <div className="hidden xl:flex flex-col leading-tight">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">{" "} Items</span>
                    <span className="text-[13px] font-semibold text-[#3d4750]">Wishlist</span>
                  </div>
                </Link>

                {/* Cart */}
                <button
                  onClick={openCartSidebarView}
                  className="relative flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  title="Cart"
                >
                  <div className="relative">
                    <RiShoppingCart2Line className="w-6 h-6 text-[#6c7fd8]" />

                    <span className="absolute -top-1.5 -right-1.5 bg-[#6c7fd8] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {totalItem}
                    </span>

                  </div>
                  <div className="hidden xl:flex flex-col leading-tight">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wider">{" "} Items</span>
                    <span className="text-[13px] font-semibold text-[#3d4750]">Cart</span>
                  </div>
                </button>

                {/* Mobile right menu (was duplicate) */}
                {/* <button
                  onClick={toggleMenu}
                  className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 ml-1"
                  aria-label="Menu"
                >
                  <RiMenu3Fill className="text-xl text-[#3d4750]" />
                </button> */}
              </div>
            </div>

            {/* Mobile: search below */}
            <div className="md:hidden mt-3">
              <SearchBar />
            </div>
          </div>
        </div>

        {/* ─── CATEGORY NAV (desktop) ─── */}
        <div className="hidden lg:block border-t border-[#f1f1f1] bg-white">
          <div className="mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] px-4">
            <div className="flex items-center gap-3">

              {/* "All categories" popup trigger */}
              <button
                onClick={toggleCategory}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-3 text-[14px] font-medium text-[#6c7fd8] hover:bg-[#f5f7ff] transition-colors border-r border-[#f1f1f1]"
              >
                <RiAppsLine className="w-5 h-5" />
                <span>All Categories</span>
              </button>

              {/* Scrollable nav */}
              <div className="flex-1 overflow-hidden">
                <Suspense fallback={<div className="py-3 text-sm text-gray-400">Loading...</div>}>
                  <HeaderCategoryList categories={categoriesData} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MOBILE MENU OVERLAY ─── */}
        {isMobileMenu && (
          <div
            className="fixed inset-0 bg-black/50 z-[16] lg:hidden"
            onClick={toggleMenu}
          />
        )}

        {/* ─── MOBILE DRAWER ─── */}
        <div
          className={`fixed top-0 left-0 h-full w-[320px] max-w-[85vw] bg-white z-[17] transition-transform duration-300 overflow-y-auto lg:hidden ${isMobileMenu ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="flex items-center justify-between p-4 border-b border-[#eee]">
            <span className="text-base font-semibold text-[#3d4750]">My Menu</span>
            <button onClick={toggleMenu} className="text-2xl text-red-500" aria-label="Close">
              <RiCloseFill />
            </button>
          </div>

          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  onClick={toggleMenu}
                  className="block px-4 py-3 rounded-xl border border-[#eee] text-[14px] font-medium text-[#3d4750] hover:bg-[#f5f7ff]"
                >
                  Home
                </Link>
              </li>

              <li>
                <button
                  onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#eee] text-[14px] font-medium text-[#3d4750] hover:bg-[#f5f7ff]"
                >
                  <span>Categories</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${mobileCategoryOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  className={`grid transition-all duration-300 ${mobileCategoryOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
                    }`}
                >
                  <div className="overflow-hidden">
                    <div className="pl-3 space-y-1.5">
                      {categoriesData?.map((category: any) => (
                        <Link
                          key={category._id}
                          href={`/category/${category.slug}`}
                          onClick={() => { setMobileMenu(false); setMobileCategoryOpen(false); }}
                          className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#f8f8f8] hover:bg-[#6c7fd8] hover:text-white text-[#3d4750] text-[13px] font-medium transition-colors"
                        >
                          <span>{category.name}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </li>

              {[
                { href: '/products', label: 'Products' },
                { href: '/about-us', label: 'About Us' },
                { href: '/blog', label: 'Blog' },
                { href: isLoggedIn ? '/user/dashboard' : '/login', label: isLoggedIn ? 'My Account' : 'Login' },
                { href: '/wishlist', label: `Wishlist (${wishlistCount})` },
                { href: '/user/orders', label: 'Track Order' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={toggleMenu}
                    className="block px-4 py-3 rounded-xl border border-[#eee] text-[14px] font-medium text-[#3d4750] hover:bg-[#f5f7ff]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social */}
            <div className="mt-8">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 text-center">Follow Us</p>
              <ul className="flex justify-center gap-2">
                {socialLinks.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener"
                      className="w-9 h-9 flex items-center justify-center bg-[#3d4750] hover:bg-[#6c7fd8] text-white rounded-lg transition-colors"
                    >
                      <item.icon className="text-[14px]" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </header>

      {/* All categories popup */}
      {isOpen && (
        <Suspense fallback={null}>
          <CategoryPopup onClose={toggleClose} category={categoriesData.slice(0, 15)} />
        </Suspense>
      )}
    </>
  );
}