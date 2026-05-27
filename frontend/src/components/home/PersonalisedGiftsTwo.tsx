
"use client";
import { personalizedGiftService } from "@/_services/common/personalizedGiftService";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import {
  RiArrowRightLine,
  RiSparkling2Line,
} from "react-icons/ri";

function PersonalizedGiftsTwo() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchData = async () => {
      try {
        const response = await personalizedGiftService.getAll("Personalized");
        setProducts(
          response?.data || []
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  return (
    <section className="relative overflow-hidden bg-[#111128] py-14 sm:py-16">

      {/* Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-400/10 blur-3xl rounded-full" />

      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="text-center mb-10 sm:mb-14">

          <span className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-full mb-4">
            <RiSparkling2Line size={14} />
            Customized Collection
          </span>

          <h2
            className="text-3xl sm:text-5xl font-bold text-white leading-tight"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
            }}
          >
            Personalized Gifts Crafted With Love
          </h2>

          <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
            Discover premium customized gifts, acrylic frames,
            LED lamps and handcrafted personalized products
            made for unforgettable moments.
          </p>

        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

          {
            !loading ? (
              products.map((product, index) => (
                <div
                  key={index}
                  className="group"
                >
                  <Link
                    href={product.link}
                    className="block relative overflow-hidden rounded-[28px] bg-[#13132a] border border-white/10 hover:border-amber-400/40 transition-all duration-500 shadow-xl hover:shadow-amber-400/10 hover:-translate-y-2"
                  >
                    <div className="relative aspect-[4/4.8] overflow-hidden">

                      {product?.type === "video" ? (

                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        >
                          <source
                            src={product?.videoUrl || product?.media?.url}
                            type="video/mp4"
                          />
                        </video>

                      ) : (

                        <Image
                          width={600}
                          height={700}
                          src={product?.media?.url}
                          alt={product?.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/20 to-transparent hidden sm:block" />

                      {product?.badge && (
                        <div className="absolute top-4 left-4 hidden sm:block">

                          <span className="inline-flex items-center bg-amber-400 text-black text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">

                            {product.badge}

                          </span>

                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 hidden sm:block">

                        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4">

                          <div className="flex items-center justify-between gap-3">

                            <div>

                              <h3
                                className="text-white text-sm sm:text-base font-bold leading-snug group-hover:text-amber-300 transition-colors"
                                style={{
                                  fontFamily:
                                    "'Cormorant Garamond', serif",
                                }}
                              >

                                {product?.name}

                              </h3>

                              <p className="text-white/40 text-xs mt-1">

                                Personalized Premium Gift

                              </p>

                            </div>

                            <div className="w-11 h-11 rounded-full border border-white/15 bg-white/5 flex items-center justify-center group-hover:bg-amber-400 group-hover:border-amber-400 transition-all duration-300 shrink-0">

                              <RiArrowRightLine
                                size={18}
                                className="text-white group-hover:text-black"
                              />

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </Link>
                </div>
              ))
            ) : (

              Array.from({ length: 8 }).map((_, index) => (

                <div
                  key={index}
                  className="aspect-[3/4] rounded-3xl bg-white/5 animate-pulse"
                />

              ))

            )
          }


        </div>

      </div>
    </section>
  );
}

export default PersonalizedGiftsTwo;
