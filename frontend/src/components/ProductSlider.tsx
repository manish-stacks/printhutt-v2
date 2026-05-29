"use client";

import React from "react";
import { Product } from "@/lib/types/product";
import Slider from "react-slick";
import ProductCardTwo from "./products/ProductCardTwo";

import {
  RiArrowLeftLine,
  RiArrowRightLine,
} from "react-icons/ri";

interface PopupProps {
  products: Product[];
  title: string;
}

const ProductSlider = ({
  products, title
}: PopupProps) => {

  const sliderRef = React.useRef<any>(null);

  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 800,
    autoplaySpeed: 4000,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: false,
    pauseOnHover: true,
    cssEase: "ease-in-out",

    appendDots: (dots: React.ReactNode) => (
      <div>
        <ul className="flex justify-center gap-2 mt-10">
          {dots}
        </ul>
      </div>
    ),

    customPaging: () => (
      <div className="w-2.5 h-2.5 rounded-full bg-white/20 hover:bg-amber-400 transition-all duration-300" />
    ),

    responsive: [
      {
        breakpoint: 1400,
        settings: {
          slidesToShow: 4,
        },
      },

      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2.5,
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
          slidesToShow: 2,
        },
      },
    ],
  };

  return (
    <div className="relative">
      {/* Top Controls */}
      <div className="flex items-center justify-between mb-8">

        {/* Left */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10 sm:mb-14">
          <div>
            <div className="hidden sm:flex items-center gap-3">
              <h2
                className="text-3xl sm:text-5xl text-[#0d0d1a] font-bold leading-tight"
                style={{
                  fontFamily:
                    "'Cormorant Garamond', serif",
                }}
              >
                <div className="w-12 h-[1px] bg-gradient-to-r from-amber-400 to-transparent" />
                <span className="text-[#0d0d1a]/40 uppercase tracking-[0.2em] text-2xl font-semibold">
                  {title}
                </span>
              </h2>
            </div>
            <p className="text-[#0d0d1a]/60 text-sm sm:text-base mt-4 max-w-xl leading-relaxed">
              Discover premium handcrafted products,
              glowing gifts and personalized designs
              curated specially for you.
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 ml-auto">

          <button
            onClick={() =>
              sliderRef.current?.slickPrev()
            }
            className="group relative overflow-hidden w-11 h-11 rounded-2xl border border-white/10 bg-[#13132a] hover:border-amber-400 transition-all duration-300 flex items-center justify-center"
          >

            <div className="absolute inset-0 bg-amber-400 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-2xl" />

            <RiArrowLeftLine
              size={18}
              className="relative z-10 text-white group-hover:text-black transition-colors"
            />

          </button>

          <button
            onClick={() =>
              sliderRef.current?.slickNext()
            }
            className="group relative overflow-hidden w-11 h-11 rounded-2xl border border-white/10 bg-[#13132a] hover:border-amber-400 transition-all duration-300 flex items-center justify-center"
          >

            <div className="absolute inset-0 bg-amber-400 scale-0 group-hover:scale-100 transition-transform duration-300 rounded-2xl" />

            <RiArrowRightLine
              size={18}
              className="relative z-10 text-white group-hover:text-black transition-colors"
            />

          </button>

        </div>

      </div>

      {/* Slider */}
      <Slider
        ref={sliderRef}
        {...settings}
      >
        {products &&
          products.map((product, index) => (
            <div
              key={index}
              className="px-2 pb-4"
            >

              <div className="relative h-full">

                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-400/0 via-amber-400/0 to-amber-400/5 opacity-0 hover:opacity-100 transition duration-500 rounded-[30px]" />

                {/* Product */}
                <div className="relative z-10">
                  <ProductCardTwo
                    product={product}
                  />
                </div>

              </div>

            </div>
          ))}
      </Slider>

      {/* Bottom Blur */}
      <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[300px] h-[120px] bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />

    </div>
  );
};

export default ProductSlider;




// import { Product } from "@/lib/types/product";
// import React from "react";
// import Slider from "react-slick";
// import ProductCardTwo from "./products/ProductCardTwo";


// interface PopupProps {
//   products: Product[];
// }

// const ProductSlider = ({ products }: PopupProps) => {


//   const settings = {
//     dots: false,
//     infinite: true,
//     autoplay: true,
//     speed: 500,
//     slidesToShow: 4,
//     slidesToScroll: 1,
//     arrows: false,
//     responsive: [
//       {
//         breakpoint: 1400,
//         settings: {
//           slidesToShow: 4,
//           slidesToScroll: 1,
//         },
//       },
//       {
//         breakpoint: 1024,
//         settings: {
//           slidesToShow: 2,
//           slidesToScroll: 1,
//         },
//       },
//       {
//         breakpoint: 768,
//         settings: {
//           slidesToShow: 2,
//           slidesToScroll: 1,
//         },
//       },
//     ],


//   };


//   return (
//     <>
//       <Slider {...settings}>
//         {products && products.map((product, index) => (
//           <div key={index}>
//             <ProductCardTwo product={product} />
//           </div>
//         ))}
//       </Slider>
//     </>
//   );
// };

// export default ProductSlider;