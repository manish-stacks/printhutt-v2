"use client";

import { testimonialService } from "@/_services/common/testimonialService";
import React, { useEffect, useState } from "react";

import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


import {
  RiPlayFill,
  RiStarFill,
  RiDoubleQuotesL,
} from "react-icons/ri";


interface TestimonialProps {
  imgSrc: string;
  name: string;
  date?: string;
  rating?: number;
  review: string;
  hasVideo?: boolean;
}

interface ITestimonial {
  _id: string;
  name: string;
  feedback: string;
  rating?: number;
  imgSrc?: string;

  image?: {
    url: string;
  };

  isActive: boolean;
  createdAt?: string;
}

const Testimonial = ({
  imgSrc,
  name,
  date,
  rating = 5,
  review,
  hasVideo = false,
}: TestimonialProps) => (
  <div className="group relative overflow-hidden rounded-[15px] border border-white/10 bg-[#13132a] hover:border-amber-400/40 transition-all duration-500 hover:-translate-y-2 shadow-xl hover:shadow-amber-400/10">

    {/* Image */}
    <div className="relative aspect-[4/5] overflow-hidden">

      <img
        src={imgSrc}
        alt={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1a] via-[#0d0d1a]/10 to-transparent" />

      {/* Video Button */}
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center">

          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center group-hover:bg-amber-400 group-hover:border-amber-400 transition-all duration-300">

            <RiPlayFill
              size={28}
              className="text-white group-hover:text-black ml-1"
            />

          </div>

        </div>
      )}

      {/* Quote */}
      <div className="absolute top-4 right-4">

        <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center">

          <RiDoubleQuotesL
            size={20}
            className="text-amber-300"
          />

        </div>

      </div>

    </div>

    {/* Content */}
    <div className="p-5">

      {/* Top */}
      <div className="flex items-start justify-between gap-3 mb-4">

        <div>

          <h3
            className="text-white text-lg font-bold"
            style={{
              fontFamily:
                "'Cormorant Garamond', serif",
            }}
          >
            {name}
          </h3>

          {date && (
            <p className="text-white/40 text-xs mt-1">
              {date}
            </p>
          )}

        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">

          {[...Array(5)].map((_, i) => (
            <RiStarFill
              key={i}
              size={14}
              className={
                i < rating
                  ? "text-amber-400"
                  : "text-white/10"
              }
            />
          ))}

        </div>

      </div>

      {/* Review */}
      <p className="text-white/60 text-sm leading-relaxed line-clamp-4">
        {review}
      </p>

    </div>

  </div>
);

export const TestimonialCard = () => {

  const [testimonialData, setTestimonialData] =
    useState<ITestimonial[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    const fetchData = async () => {

      try {

        const response =
          await testimonialService.getAll();

        const activeTestimonials =
          response?.testimonials?.filter(
            (item: ITestimonial) =>
              item.isActive
          ) || [];

        setTestimonialData(
          activeTestimonials
        );

      } catch (error) {

        console.error(
          "Error fetching testimonials:",
          error
        );

      } finally {

        setLoading(false);

      }
    };

    fetchData();

  }, []);

  
const settings = {
  dots: false,
  infinite: true,
  autoplay: true,

  speed: 800,
  autoplaySpeed: 3000,

  slidesToShow: 4,
  slidesToScroll: 1,

  arrows: false,

  swipe: true,
  draggable: true,
  swipeToSlide: true,
  touchMove: true,

  pauseOnHover: true,

  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 3,
      },
    },
    {
      breakpoint: 768,
      settings: {
        slidesToShow: 2,
      },
    },
    {
      breakpoint: 576,
      settings: {
        slidesToShow: 1,
      },
    },
  ],
};



  if (loading) {
    return (
      <section className="bg-[#0d0d1a] py-20 hidden md:block">

        <div className="flex items-center justify-center">

          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />

        </div>

      </section>
    );
  }

  if (!testimonialData.length) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-[#0d0d1a] py-14 sm:py-16 hidden md:block">

      {/* Glow */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-pink-500/10 blur-3xl rounded-full" />

      <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-400/10 blur-3xl rounded-full" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6">

        {/* Heading */}
        <div className="text-center mb-10 sm:mb-14">

          <span className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] uppercase tracking-[0.2em] font-bold px-4 py-2 rounded-full mb-4">
            Customer Reviews
          </span>

          <h2
            className="text-3xl sm:text-5xl text-white font-bold leading-tight"
            style={{
              fontFamily:
                "'Cormorant Garamond', serif",
            }}
          >
            What Our Customers Say
          </h2>

          <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto mt-4 leading-relaxed">
            Real reviews from our happy customers who
            loved our personalized glowing gifts and
            premium handcrafted products.
          </p>

        </div>

        {/* Dynamic Grid */}
        
<Slider {...settings}>

  {testimonialData.map(
    (testimonial) => (

      <div
        key={testimonial._id}
        className="px-3"
      >

        <Testimonial
          imgSrc={
            testimonial?.imgSrc ||
            testimonial?.image?.url ||
            "/placeholder.jpg"
          }
          name={testimonial.name}
          rating={
            testimonial.rating || 5
          }
          review={
            testimonial.feedback
          }
          hasVideo={false}
          date=""
        />

      </div>
    )
  )}

</Slider>



      </div>

    </section>
  );
};