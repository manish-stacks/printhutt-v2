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

// import { formatCurrency } from "@/helpers/helpers";
// import Image from "next/image";
// import Link from "next/link";
// import React, { useEffect, useRef } from "react";


// interface PopupProps {
//   onClose: () => void;
//   category: string | null;
//   products: string | null;
// }

// const CategoryPopup = ({ onClose, category, products }: PopupProps) => {

//   const popupRef = useRef(null);

//   const handleClickOutside = (event) => {
//     if (popupRef.current && !popupRef.current.contains(event.target)) {
//       onClose();
//     }
//   };

//   useEffect(() => {
//     document.addEventListener('mousedown', handleClickOutside);

//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // console.log(category)
//   return (
//     <>
//       {/* Category Popup */}
//       <div className="bb-category-sidebar transition-all duration-[0.3s] ease-in-out w-full h-full fixed top-[0] z-[17] ">
//         <div className="bb-category-overlay  w-full h-screen fixed top-[0] left-[0] bg-[#00000080] z-[17]" />
//         <div ref={popupRef} className="category-sidebar w-[calc(100%-30px)] max-[1199px]:h-[calc(100vh-60px)] max-w-[1200px] my-[15px] mx-[auto] py-[30px] px-[15px] text-[14px] font-normal transition-all duration-[0.5s] ease-in-out delay-[0s] bg-[#fff] overflow-auto rounded-[30px] z-[18] relative">
//           <button
//             type="button"
//             className="bb-category-close transition-all duration-[0.3s] ease-in-out w-[16px] h-[20px] absolute top-[-5px] right-[27px] bg-[#e04e4eb3] rounded-[10px] cursor-pointer hover:bg-[#e04e4e]"
//             title="Close"
//             onClick={onClose}
//           />
//           <div className="w-full mx-auto">
//             <div className="flex flex-wrap w-full mb-[-24px]">

//               <div className="w-full">
//                 <div className="flex flex-wrap w-full">
//                   <div className="w-full px-[12px]">
//                     <div className="sub-title mb-[20px] flex justify-between">
//                       <h4 className="font-quicksand tracking-[0.03rem] leading-[1.2] text-[20px] font-bold text-[#3d4750] capitalize">
//                         Explore Categories
//                       </h4>
//                     </div>
//                   </div>

//                   {
//                     category && category.length > 0 ? (
//                       category.map((cat, index) => (
//                         <div key={index} className="min-[1200px]:w-[16.66%] min-[768px]:w-[33.33%] min-[576px]:w-[50%] max-[480px]:w-[50%] w-full px-[12px] mb-[24px] ">
//                           <div className={`bb-category-box p-[30px] rounded-[20px] flex flex-col items-center text-center max-[1399px]:p-[20px] category-items-category-items-${index + 1} ${(index % 2 === 0 ? 'bg-[#f4f1fe]' : 'bg-[#fef1f1]')}`}>
//                             <div className="category-image mb-[12px]">
//                               <Image
//                                 src={cat.image.url}
//                                 alt="category"
//                                 width={100}
//                                 height={100}
//                                 className="w-[50px] h-[50px] max-[1399px]:h-[65px] max-[1399px]:w-[65px] max-[1199px]:h-[50px] max-[1199px]:w-[50px] rounded-md"
//                               />
//                             </div>
//                             <div className="category-sub-contact">
//                               <h5 className="mb-[2px] text-[16px] font-quicksand text-[#3d4750] font-semibold tracking-[0.03rem] leading-[1.2]">
//                                 <Link
//                                   href={`/category/${cat.slug}`}
//                                   className="font-Poppins text-[16px] font-medium leading-[1.2] tracking-[0.03rem] text-[#3d4750] capitalize"
//                                 >
//                                   {cat.name}
//                                 </Link>
//                               </h5>
//                               <p className="font-Poppins text-[13px] text-[#686e7d] leading-[25px] font-light tracking-[0.03rem]">
//                                 {cat.totalProducts} items
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       ))
//                     ) : (
//                       Array.from({ length: 6 }).map((_, index) => (
//                         <div
//                           key={index}
//                           className="min-[1200px]:w-[16.66%] min-[768px]:w-[33.33%] min-[576px]:w-[50%] w-full px-[12px] mb-[24px]"
//                         >
//                           <div className="bb-category-box p-[30px] rounded-[20px] flex flex-col items-center text-center max-[1399px]:p-[20px] bg-[#fef1f1]">
//                             {/* Skeleton for Category Image */}
//                             <div className="category-image mb-[12px]">
//                               <div className="skeleton w-[50px] h-[50px] max-[1399px]:h-[65px] max-[1399px]:w-[65px] max-[1199px]:h-[50px] max-[1199px]:w-[50px] rounded-md bg-gray-200" />
//                             </div>

//                             {/* Skeleton for Text */}
//                             <div className="category-sub-contact w-full">
//                               <div className="skeleton w-[70%] h-[16px] bg-gray-200 mx-auto mb-[8px]" />
//                               <div className="skeleton w-[50%] h-[14px] bg-gray-200 mx-auto" />
//                             </div>
//                           </div>
//                         </div>
//                       ))
//                     )}



//                 </div>
//               </div>
//               <div className="w-full">
//                 <div className="flex flex-wrap w-full">
//                   <div className="w-full px-[12px]">
//                     <div className="sub-title mb-[20px] flex justify-between">
//                       <h4 className="font-quicksand tracking-[0.03rem] leading-[1.2] text-[20px] font-bold text-[#3d4750] capitalize">
//                         Related products
//                       </h4>
//                     </div>
//                   </div>

//                   {
//                     products && products.length > 0 ? (
//                       products.map((product, index) => (
//                         <div key={index} className="min-[992px]:w-[33.33%] min-[576px]:w-[50%] max-[480px]:w-[50%] w-full px-[12px] mb-[24px] ">
//                           <div className="bb-category-cart p-[15px] overflow-hidden bg-[#f8f8fb] border-[1px] border-solid border-[#eee] rounded-[10px] flex max-[767px]:flex-col">
//                             <Link
//                               href={`/product-details/${product.slug}`}
//                               className="pro-img mr-[12px] max-[767px]:mb-[15px] max-[767px]:mr-[0]"
//                             >
//                               <Image
//                                 src={product.thumbnail.url}
//                                 alt={product.title}
//                                 width={80}
//                                 height={80}
//                                 className="w-[80px] rounded-[10px] border-[1px] border-solid border-[#eee] max-[767px]:w-full"
//                               />
//                             </Link>
//                             <div className="side-contact flex flex-col">
//                               <h4 className="bb-pro-title text-[15px]">
//                                 <Link
//                                   href={`/product-details/${product.slug}`}
//                                   className="transition-all duration-[0.3s] ease-in-out flex font-Poppins text-[15px] leading-[28px] tracking-[0.03rem] font-medium text-[#3d4750]"
//                                 >
//                                   {product.title}
//                                 </Link>
//                               </h4>
//                               <span className="bb-pro-rating">
//                                 <i className="ri-star-fill float-left text-[15px] mr-[3px] leading-[26px] text-[#fea99a]" />
//                                 <i className="ri-star-fill float-left text-[15px] mr-[3px] leading-[26px] text-[#fea99a]" />
//                                 <i className="ri-star-fill float-left text-[15px] mr-[3px] leading-[26px] text-[#fea99a]" />
//                                 <i className="ri-star-fill float-left text-[15px] mr-[3px] leading-[26px] text-[#fea99a]" />
//                                 <i className="ri-star-line float-left text-[15px] mr-[3px] leading-[26px] text-[#777]" />
//                               </span>
//                               <div className="inner-price mx-[-3px]">
//                                 <span className="new-price px-[3px] text-[15px] text-[#686e7d] font-semibold">
//                                   {product.discountType === 'percentage'
//                                     ? formatCurrency(product.price - (product.price * product.discountPrice) / 100)
//                                     : formatCurrency(product.price - product.discountPrice)}
//                                 </span>
//                                 <span className="old-price px-[3px] text-[14px] text-[#686e7d] line-through">
//                                   {product.discountPrice > 0 ? formatCurrency(product.price) : ''}
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       ))
//                     ) : (
//                       Array.from({ length: 6 }).map((_, index) => (
//                         <div
//                           key={index}
//                           className="min-[992px]:w-[33.33%] min-[576px]:w-[50%] w-full px-[12px] mb-[24px]"
//                         >
//                           <div className="bb-category-cart p-[15px] overflow-hidden bg-[#f8f8fb] border-[1px] border-solid border-[#eee] rounded-[10px] flex max-[767px]:flex-col">
//                             {/* Skeleton for Product Image */}
//                             <div className="pro-img mr-[12px] max-[767px]:mb-[15px] max-[767px]:mr-[0]">
//                               <div className="skeleton w-[80px] h-[80px] rounded-[10px] bg-gray-200 border-[1px] border-solid border-[#eee] max-[767px]:w-full" />
//                             </div>

//                             {/* Skeleton for Product Details */}
//                             <div className="side-contact flex flex-col">
//                               {/* Skeleton for Title */}
//                               <div className="skeleton w-[70%] h-[16px] bg-gray-200 mb-[8px]" />

//                               {/* Skeleton for Rating */}
//                               <div className="flex gap-[3px] mb-[8px]">
//                                 {Array.from({ length: 5 }).map((_, i) => (
//                                   <div
//                                     key={i}
//                                     className={`skeleton w-[15px] h-[15px] rounded-full ${i < 4 ? 'bg-[#fea99a]' : 'bg-gray-200'
//                                       }`}
//                                   />
//                                 ))}
//                               </div>

//                               {/* Skeleton for Price */}
//                               <div className="inner-price flex gap-[3px]">
//                                 <div className="skeleton w-[50px] h-[15px] bg-gray-200" />
//                                 <div className="skeleton w-[40px] h-[14px] bg-gray-200" />
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       ))

//                     )
//                   }


//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default CategoryPopup;
