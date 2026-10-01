"use client";

import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";

import ProductSlider from "../ProductSlider";
import { productService } from "@/_services/common/productService";

const DayoftheWeek = ({
  title,
  catID,
}: {
  title: string;
  catID: string;
}) => {
  const [productData, setProductData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // ✅ FIX: useEffect mein seedha fetch nahi — IntersectionObserver se
    // Visible hone pe hi API call karo. Home page pe 5-6 DayoftheWeek hain
    // Sab ek saath fetch karte the on mount — ab sirf visible wala fetch karega
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          productService
            .getTopProducts(6, catID)
            .then((res: any) => setProductData(res?.products || []))
            .catch(console.error)
            .finally(() => setLoading(false));
        }
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [catID]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-gradient-to-b from-white to-[#f8f6fd] [&:nth-of-type(even)]:to-white">

      {/* Glow */}
      <div className="pointer-events-none absolute top-0 left-0 w-72 h-72 bg-pink-500/10 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-amber-400/10 blur-3xl rounded-full" />

      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6">

        {/* Content */}
        {loading ? (

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 py-10">

            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm"
                >

                  {/* Image Skeleton */}
                  <div className="aspect-[4/5] bg-gray-100 animate-pulse" />

                  {/* Content Skeleton */}
                  <div className="p-5">

                    <div className="h-4 w-24 rounded bg-gray-100 animate-pulse mb-3" />

                    <div className="h-6 w-full rounded bg-gray-100 animate-pulse mb-4" />

                    <div className="flex items-center justify-between">

                      <div className="h-5 w-20 rounded bg-gray-100 animate-pulse" />

                      <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        ) : (

          <Suspense
            fallback={
              <div className="text-gray-500 py-10 text-center">
                Loading...
              </div>
            }
          >
            <ProductSlider
              products={productData}
              title={title}
            />
          </Suspense>

        )}

      </div>
    </section>
  );
};

export default DayoftheWeek;

