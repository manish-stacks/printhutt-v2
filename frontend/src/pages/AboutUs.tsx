"use client";

import React from "react";
import Breadcrumb from "@/components/Breadcrumb";
import OurServices from "@/components/OurServices";
import { TestimonialCard } from "@/components/TestimonialCard";
import Image from "next/image";
import {
  FaAward,
  FaBoxOpen,
  FaShieldAlt,
  FaTruck,
  FaUsers,
  FaBolt,
} from "react-icons/fa";

const stats = [
  {
    number: "200+",
    label: "Premium Products",
    icon: <FaBoxOpen size={26} />,
  },
  {
    number: "654K+",
    label: "Successful Orders",
    icon: <FaBolt size={26} />,
  },
  {
    number: "587K+",
    label: "Happy Customers",
    icon: <FaUsers size={26} />,
  },
];

const features = [
  {
    title: "Premium Quality",
    desc: "Top-quality materials with long-lasting durability and clean finishing.",
    icon: <FaAward size={24} />,
  },
  {
    title: "Tested & Trusted Quality",
    desc: "We ensure durable, long-lasting neon signs with high-quality materials and finishing.",
    icon: <FaShieldAlt size={24} />,
  },
  {
    title: "Fast Shipping",
    desc: "Quick production and fast delivery across India with secure packaging.",
    icon: <FaTruck size={24} />,
  },
];


const AboutUs = () => {
  return (
    <>
      {/* <Breadcrumb title={"About Us"} /> */}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f5f7ff] via-white to-[#eef1ff] py-[80px] max-md:py-[50px]">
        <div className="mx-auto max-w-[1320px] px-[12px]">
          <div className="grid grid-cols-2 gap-[50px] items-center max-lg:grid-cols-1">

            {/* LEFT CONTENT */}
            <div>
              <span className="inline-flex items-center rounded-full bg-[#6c7fd8]/10 px-4 py-2 text-[14px] font-semibold text-[#6c7fd8]">
                India’s Trusted Neon Sign Brand
              </span>

              <h1 className="mt-5 text-[54px] leading-[1.1] font-bold text-[#1e293b] max-lg:text-[42px] max-md:text-[34px]">
                Creating Stunning
                <span className="text-[#6c7fd8]"> Neon Sign Boards </span>
                & Custom Name Plates
              </h1>

              <p className="mt-6 text-[16px] leading-[30px] text-[#64748b]">
                Founded by Shivank Arora in 2016, Print Hutt delivers
                handcrafted neon signs and customized branding solutions with
                premium quality, modern aesthetics, and exceptional durability.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <div className="rounded-[18px] border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
                  <p className="text-[14px] text-[#94a3b8]">Experience</p>
                  <h4 className="text-[22px] font-bold text-[#111827]">
                    8+ Years
                  </h4>
                </div>

               
                <div className="rounded-[18px] border border-[#e5e7eb] bg-white px-5 py-4 shadow-sm">
                  <p className="text-[14px] text-[#94a3b8]">Shipping</p>
                  <h4 className="text-[22px] font-bold text-[#111827]">
                    Free PAN India
                  </h4>
                </div>
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative">
              <div className="absolute -top-8 -left-8 h-[120px] w-[120px] rounded-full bg-[#6c7fd8]/20 blur-3xl"></div>

              <div className="relative overflow-hidden rounded-[32px] border border-white/50 bg-white p-3 shadow-2xl">
                <Image
                  src="/img/banner/custom-neon.jpg"
                  alt="Print Hutt"
                  width={700}
                  height={700}
                  className="h-[500px] w-[600px] rounded-[24px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-[70px] max-md:py-[50px] bg-white">
        <div className="mx-auto max-w-[1320px] px-[12px]">
          <div className="text-center mb-[50px]">
            <h2 className="text-[42px] font-bold text-[#1e293b] max-md:text-[30px]">
              Why Choose Print Hutt?
            </h2>

            <p className="mt-4 text-[16px] text-[#64748b] max-w-[700px] mx-auto leading-[28px]">
              We combine creativity, technology, and craftsmanship to deliver
              premium custom neon signage solutions for homes, businesses, and
              events.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-2 max-md:grid-cols-1">
            {features.map((item, index) => (
              <div
                key={index}
                className="group rounded-[28px] border border-[#edf0f3] bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#6c7fd8] hover:shadow-2xl"
              >
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-[#6c7fd8]/10 text-[#6c7fd8]">
                  {item.icon}
                </div>

                <h3 className="mt-6 text-[24px] font-bold text-[#1e293b]">
                  {item.title}
                </h3>

                <p className="mt-4 text-[15px] leading-[28px] text-[#64748b]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#111827] py-[70px]">
        <div className="mx-auto max-w-[1320px] px-[12px]">
          <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
            {stats.map((item, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md"
              >
                <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#6c7fd8]/20 text-[#8ea2ff]">
                  {item.icon}
                </div>

                <h3 className="mt-5 text-[42px] font-bold text-white">
                  {item.number}
                </h3>

                <p className="mt-2 text-[16px] text-[#cbd5e1]">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY SECTION */}
      <section className="bg-[#f8fafc] py-[80px] max-md:py-[50px]">
        <div className="mx-auto max-w-[1000px] px-[12px] text-center">
          <span className="rounded-full bg-[#6c7fd8]/10 px-5 py-2 text-[14px] font-semibold text-[#6c7fd8]">
            Our Journey
          </span>

          <h2 className="mt-5 text-[42px] font-bold text-[#1e293b] max-md:text-[30px]">
            Passion. Creativity. Innovation.
          </h2>

          <p className="mt-6 text-[17px] leading-[34px] text-[#64748b]">
            At Print Hutt, our mission is to transform ordinary spaces into
            visually stunning environments through customized neon signs and
            personalized branding products. Our skilled designers and
            manufacturing team work passionately to create products that leave a
            lasting impression.
          </p>

          <p className="mt-5 text-[17px] leading-[34px] text-[#64748b]">
            From home decor neon lights to commercial branding signboards, we
            focus on quality craftsmanship, customer satisfaction, and modern
            design trends.
          </p>
        </div>
      </section>

      <OurServices />
      <TestimonialCard />
    </>
  );
};

export default AboutUs;