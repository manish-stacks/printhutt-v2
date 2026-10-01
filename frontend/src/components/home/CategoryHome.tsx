"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { RiArrowRightUpLine, RiFlashlightFill } from "react-icons/ri";

const products = [
  { name: "Customize Neon Sign", image: "/img/banner/custom-neon.jpg", url: "/product/customize-neon-sign", price: "1199", badge: "Bestseller", glow: "#ff2d95", tag: "Your text, your colours" },
  { name: "Custom Pixel Pro Sign", image: "/img/banner/custom-pixel-pro.jpg", url: "/product/flow-mo-neon-sign", price: "2499", badge: "Trending", glow: "#22d3ee", tag: "Animated pixel glow" },
  { name: "Pre Neon Sign Collection", image: "/img/banner/pre-neon.png", url: "/category/neon", price: "899", badge: "30% OFF", glow: "#fbbf24", tag: "Ready-to-ship designs" },
];

const CategoryHome = () => (
  <section className="relative overflow-hidden bg-[#0a0a18] py-12 sm:py-20">
    {/* Neon ambience */}
    <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-pink-500/20 blur-[110px]" />
    <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-cyan-400/20 blur-[110px]" />
    <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

    <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6">
      {/* Heading */}
      <div className="mb-8 text-center sm:mb-14">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-pink-400/30 bg-pink-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-pink-300 sm:text-[11px]">
          <RiFlashlightFill size={13} /> Handcrafted LED Neon
        </span>
        <h2
          className="text-3xl font-bold leading-tight text-white sm:text-6xl"
          style={{ fontFamily: "'Cormorant Garamond', serif", textShadow: "0 0 24px rgba(255,45,149,.55), 0 0 60px rgba(34,211,238,.25)" }}
        >
          Explore Premium Neon
        </h2>
        <p className="mx-auto mt-4 hidden max-w-2xl text-sm leading-relaxed text-white/60 sm:block sm:text-base">
          Discover handcrafted premium neon signs, custom LED lamps, acrylic frames and personalised glowing gifts.
        </p>
      </div>

      {/* Cards: mobile = swipe row, desktop = 3-col grid */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0">
        {products.map((p, i) => (
          <motion.div
            key={p.url}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="w-[78%] shrink-0 snap-center sm:w-auto"
          >
            <Link
              href={p.url}
              className="group relative block overflow-hidden rounded-2xl bg-[#12122a] transition-all duration-500 hover:-translate-y-2"
              style={{ boxShadow: `0 0 0 1px ${p.glow}55, 0 10px 40px -12px ${p.glow}66` }}
            >
              <div className="relative aspect-[4/4.2] overflow-hidden">
                <Image
                  width={600}
                  height={630}
                  src={p.image}
                  alt={p.name}
                  priority={i === 0}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12122a] via-transparent to-transparent" />
                <span
                  className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-black shadow-lg"
                  style={{ background: p.glow, boxShadow: `0 0 18px ${p.glow}99` }}
                >
                  {p.badge}
                </span>
              </div>

              {/* Info — hamesha visible (mobile par bhi) */}
              <div className="flex items-end justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0">
                  <h3
                    className="truncate text-xl font-bold leading-tight text-white sm:text-2xl"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {p.name}
                  </h3>
                  <p className="mt-1 truncate text-xs text-white/50">{p.tag}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-widest text-white/40">
                    From <span className="ml-1 text-lg font-bold normal-case tracking-normal" style={{ color: p.glow }}>₹{p.price}</span>
                  </p>
                </div>
                <span
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border text-white transition-all duration-300 group-hover:text-black"
                  style={{ borderColor: `${p.glow}88` }}
                >
                  <RiArrowRightUpLine size={20} className="relative z-10 transition-transform group-hover:rotate-45" />
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: p.glow }} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 text-center sm:mt-12">
        <Link
          href="/category/neon"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-pink-400 hover:bg-pink-500/20"
        >
          View all neon signs <RiArrowRightUpLine size={16} />
        </Link>
      </div>
    </div>
  </section>
);

export default CategoryHome;