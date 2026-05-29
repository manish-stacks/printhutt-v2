
"use client";

import React, {
  Suspense,
  useEffect,
  useState,
} from "react";

import ProductSlider from "../ProductSlider";
import { productService } from "@/_services/common/productService";

import {
  RiFlashlightLine,
  RiFireLine,
} from "react-icons/ri";

const DayoftheWeek = ({
  title,
  catID,
}: {
  title: string;
  catID: string;
}) => {
  const [productData, setProductData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const products =
        await productService.getTopProducts(
          6,
          catID
        );

      setProductData(products?.products);
    } catch (error) {
      console.error(
        "Error fetching data:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#ffffff] py-14 sm:py-16">

      {/* Glow */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-pink-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-400/10 blur-3xl rounded-full" />

      <div className="relative max-w-[1320px] mx-auto px-4 sm:px-6">

        {/* Content */}
        {loading ? (

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

            {Array.from({ length: 4 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="rounded-[28px] overflow-hidden bg-[#13132a] border border-white/10"
                >

                  {/* Image Skeleton */}
                  <div className="aspect-[4/5] bg-white/5 animate-pulse" />

                  {/* Content Skeleton */}
                  <div className="p-5">

                    <div className="h-4 w-24 rounded bg-white/10 animate-pulse mb-3" />

                    <div className="h-6 w-full rounded bg-white/10 animate-pulse mb-4" />

                    <div className="flex items-center justify-between">

                      <div className="h-5 w-20 rounded bg-white/10 animate-pulse" />

                      <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        ) : (

          <Suspense
            fallback={
              <div className="text-white">
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


// import React, { Suspense, useEffect, useState } from 'react'
// import ProductSlider from '../ProductSlider'
// import { productService } from '@/_services/common/productService';

// const DayoftheWeek = ({ title, catID }: { title: string, catID: string }) => {

//     const [productData, setProductData] = useState([]);
//     const [loading, setLoading] = useState(true);

//     const fetchData = async () => {
//         try {
//             setLoading(true)
//             const products = await productService.getTopProducts(6, catID)
//             setProductData(products?.products);
//         } catch (error) {
//             console.error("Error fetching data:", error);
//         } finally {
//             setLoading(false)
//         }
//     };
//     useEffect(() => {
//         fetchData();
//     }, []);


//     return (
//         <>
//             {/* min-[1400px]:max-w-[1320px] */}
//             <section className="section-deal overflow-hidden py-[50px] max-[1199px]:py-[35px]">
//                 <div className="flex flex-wrap justify-between relative items-center mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] min-[576px]:max-w-[540px]">
//                     <div className="flex flex-wrap w-full">
//                         <div className="w-full px-[12px] mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] min-[576px]:max-w-[540px]">
//                             <div
//                                 className="section-title bb-deal mb-[20px] pb-[20px] z-[1] relative flex justify-between max-[991px]:pb-[0] max-[991px]:flex-col max-[991px]:justify-center max-[991px]:text-center"
//                                 data-aos="fade-up"
//                                 data-aos-duration={1000}
//                                 data-aos-delay={200}
//                             >
//                                 <div className="section-detail max-[991px]:mb-[12px]">

//                                     <h1 className="text-4xl max-[576px]:text-2xl md:text-6xl font-bold text-slate-600 mb-4 font-serif"> <span className="text-rose-900" style={{ fontFamily: "DancingScript-VariableFont" }}>{title}</span></h1>
//                                     <p className="font-Poppins max-w-[400px] mt-[10px] text-[14px] text-[#686e7d] leading-[18px] font-light tracking-[0.03rem] max-[991px]:mx-[auto]">
//                                         Don&apos;t wait. The time will never be just right.
//                                     </p>
//                                 </div>
//                                 <div id="dealend" className="dealend-timer" />
//                             </div>
//                         </div>
//                         <div className="w-full mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] min-[576px]:max-w-[540px] px-[12px]">
//                             <div className="bb-deal-slider m-[-12px]">
//                                 <div className="bb-deal-block owl-carousel"></div>

//                                 {loading ? (
//                                     <div className="flex flex-wrap w-full">
//                                         {Array.from({ length: 4 }, (_, index) => (
//                                             <div
//                                                 key={index}
//                                                 className="min-[1200px]:w-[25%] min-[768px]:w-[33.33%] w-[50%] max-[480px]:w-full px-[12px] mb-[24px]"
//                                                 data-aos="fade-up"
//                                                 data-aos-duration={1000}
//                                                 data-aos-delay={200}
//                                             >
//                                                 <div className="bb-pro-box bg-[#fff] border-[1px] border-solid border-[#eee] rounded-[20px]">
//                                                     {/* Skeleton for Image */}
//                                                     <div className="bb-pro-img overflow-hidden relative border-b-[1px] border-solid border-[#eee] z-[4]">
//                                                         <div className="skeleton w-full h-[300px] bg-gray-200 rounded-t-[20px]" />
//                                                     </div>

//                                                     {/* Skeleton for Product Content */}
//                                                     <div className="bb-pro-contact p-[20px]">
//                                                         {/* Skeleton for Subtitle */}
//                                                         <div className="bb-pro-subtitle mb-[8px] flex flex-wrap justify-between">
//                                                             <div className="skeleton w-[50%] h-[16px] bg-gray-200" />
//                                                             <div className="skeleton w-[30%] h-[16px] bg-gray-200" />
//                                                         </div>

//                                                         {/* Skeleton for Title */}
//                                                         <div className="bb-pro-title mb-[8px]">
//                                                             <div className="skeleton w-[80%] h-[18px] bg-gray-200" />
//                                                         </div>

//                                                         {/* Skeleton for Price */}
//                                                         <div className="bb-price flex flex-wrap justify-between">
//                                                             <div className="skeleton w-[40%] h-[18px] bg-gray-200" />
//                                                             <div className="skeleton w-[20%] h-[18px] bg-gray-200" />
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 ) : (
//                                     <Suspense fallback={<div>Loading...</div>}>
//                                         <ProductSlider products={productData} />
//                                     </Suspense>
//                                 )
//                                 }
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </section>
//         </>
//     )
// }

// export default DayoftheWeek