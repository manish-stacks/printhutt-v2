
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiArrowRightLine,
  RiSparkling2Line,
} from "react-icons/ri";

const products = [
  {
    name: "Customize Neon Sign",
    image: "/img/banner/custom-neon.jpg",
    url: "/product/customize-neon-sign",
    price: "1199",
    badge: "🔥 Bestseller",
  },
  {
    name: "Custom Pixel Pro Sign",
    image: "/img/banner/custom-pixel-pro.jpg",
    url: "/product/flow-mo-neon-sign",
    price: "2499",
    badge: "✨ Trending",
  },
  {
    name: "Pre Neon Sign Collection",
    image: "/img/banner/pre-neon.png",
    url: "/category/neon",
    price: "899",
    badge: "⚡ 30% OFF",
  },
];

const CategoryHome = () => {
  return (
    <>
      <section className="relative overflow-hidden bg-[#f0f0f1] py-14 sm:py-16">

        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-amber-400/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-500/10 blur-3xl rounded-full" />

        <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6">

          {/* Heading */}
          <div className="text-center mb-10 sm:mb-14">

            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] font-bold text-amber-500 bg-amber-400/10 border border-amber-400/20 px-4 py-2 rounded-full mb-4 hidden lg:block md:block">
              <RiSparkling2Line size={14} />
              Featured Collection
            </span>

            <h2
              className="text-3xl sm:text-5xl font-bold text-[#0d0d1a] leading-tight "
              style={{
                fontFamily: "'Cormorant Garamond', serif",
              }}
            >
              Explore Premium Neon
            </h2>

            <p className="text-[#0d0d1a]/60 text-sm sm:text-base mt-4 max-w-2xl mx-auto leading-relaxed hidden lg:block md:block">
              Discover handcrafted premium neon signs, custom LED lamps,
              acrylic frames and personalised glowing gifts.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-5">

            {products.map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                viewport={{ once: true }}
              >
                <Link
                  href={product.url}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-[10px] lg:rounded-[15px] md:rounded-[15px] bg-[#13132a] border border-white/10 hover:border-amber-400/40 transition-all duration-500 shadow-xl hover:shadow-amber-400/10 hover:-translate-y-2">

                    {/* Image */}
                    <div className="relative aspect-[4/4.5] overflow-hidden">

                      <Image
                        width={600}
                        height={700}
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        priority
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/20 to-transparent hidden sm:block" />

                      {/* Badge */}
                      <div className="absolute top-4 left-4 hidden sm:block">
                        <span className="inline-flex items-center bg-amber-400 text-black text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg">
                          {product.badge}
                        </span>
                      </div>

                      {/* Hover Glow */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-amber-400/10 via-transparent to-transparent transition duration-500 " />

                      {/* Bottom Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 hidden sm:block">

                        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4">

                          <h3
                            className="text-white text-xl font-bold leading-tight group-hover:text-amber-300 transition-colors"
                            style={{
                              fontFamily:
                                "'Cormorant Garamond', serif",
                            }}
                          >
                            {product.name}
                          </h3>

                          <div className="flex items-center justify-between mt-4">

                            <div>
                              <p className="text-white/40 text-xs uppercase tracking-widest">
                                Starting From
                              </p>

                              <h4 className="text-amber-400 text-2xl font-bold mt-1">
                                ₹{product.price}
                              </h4>
                            </div>

                            <div className="w-11 h-11 rounded-full border border-white/15 bg-white/5 flex items-center justify-center group-hover:bg-amber-400 group-hover:border-amber-400 transition-all duration-300">
                              <RiArrowRightLine
                                size={18}
                                className="text-white group-hover:text-black"
                              />
                            </div>

                          </div>

                        </div>

                      </div>
                    </div>

                  </div>
                </Link>
              </motion.div>
            ))}

          </div>
        </div>
      </section>
    </>
  );
};

export default CategoryHome;

