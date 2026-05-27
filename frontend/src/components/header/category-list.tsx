
import Link from "next/link";
import React, { useState } from "react";

interface CategoryProps {
  categories: {
    name: string;
    slug: string;
    subcategories: {
      name: string;
      slug: string;
    }[];
  }[];
}

const HeaderCategoryList = ({
  categories,
}: CategoryProps) => {

  const [activeCategory, setActiveCategory] =
    useState<any>(null);

  return (
    <>
      {categories
        ?.slice(0, 9)
        ?.map((category, index) => (

          <li
            key={index}
            className="relative mr-[38px] group"
            onMouseEnter={() =>
              setActiveCategory(category)
            }
          >

            {/* Main Category Tab */}
            <Link
              href={`/category/${category.slug}`}
              className="flex items-center gap-[4px] py-[10px] text-[15px] font-medium text-[#3d4750] hover:text-[#6c7fd8] transition-all duration-300"
            >

              {category.name}

              {category.subcategories
                ?.length > 0 && (

                <svg
                  className="w-[14px] h-[14px] transition-transform duration-300 group-hover:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}

            </Link>

            {/* Dropdown */}
            {activeCategory?.slug ===
              category.slug &&
              category.subcategories
                ?.length > 0 && (

              <div className="absolute left-0 top-full z-[999] pt-[12px] opacity-0 invisible translate-y-[10px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300">

                <div className="min-w-[280px] bg-white border border-[#eee] rounded-[20px] shadow-[0_15px_50px_rgba(0,0,0,0.08)] overflow-hidden">

                  {/* Header */}
                  <div className="px-[18px] py-[14px] border-b border-[#f1f1f1] bg-[#fafafa]">

                    <h4 className="text-[15px] font-semibold text-[#3d4750]">

                      {category.name}

                    </h4>

                  </div>

                  {/* Subcategories */}
                  <div className="p-[12px]">

                    <div className="space-y-[4px]">

                      {category.subcategories.map(
                        (
                          subCategory,
                          subIndex
                        ) => (

                          <Link
                            key={subIndex}
                            href={`/category/${category.slug}/${subCategory.slug}`}
                            className="group/sub flex items-center justify-between rounded-[12px] px-[14px] py-[12px] text-[14px] text-[#686e7d] hover:bg-[#f5f7ff] hover:text-[#6c7fd8] transition-all duration-300"
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
                              className="w-[14px] h-[14px] opacity-0 -translate-x-1 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-all duration-300"
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
                      )}

                    </div>

                  </div>

                </div>

              </div>
            )}

          </li>
        ))}
    </>
  );
};

export default HeaderCategoryList;


// import Link from "next/link";
// import React, { useState } from "react";

// interface CategoryProps {
//   categories: {
//     name: string;
//     slug: string;
//     subcategories: {
//       name: string;
//       slug: string;
//     }[];
//   }[];
// }

// const HeaderCategoryList = ({
//   categories,
// }: CategoryProps) => {

//   const [activeCategory, setActiveCategory] =
//     useState(
//       categories?.[0] || null
//     );

//   return (
//     <li className="nav-item bb-main-dropdown relative flex items-center mr-[45px] group">

//       {/* Main Button */}
//       <button className="flex items-center gap-[6px] font-Poppins text-[15px] font-medium text-[#3d4750] hover:text-[#6c7fd8] transition-all duration-300">

//         Categories

//         <svg
//           className="w-[14px] h-[14px] transition-transform duration-300 group-hover:rotate-180"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth={2}
//           viewBox="0 0 24 24"
//         >
//           <path
//             strokeLinecap="round"
//             strokeLinejoin="round"
//             d="M19 9l-7 7-7-7"
//           />
//         </svg>

//       </button>

//       {/* Mega Menu */}
//       <div className="absolute left-0 top-full pt-[22px] opacity-0 invisible translate-y-[10px] group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-[999]">

//         <div className="w-[1050px] min-h-[480px] bg-white border border-[#eee] rounded-[22px] shadow-[0_15px_60px_rgba(0,0,0,0.08)] overflow-hidden flex">

//           {/* LEFT SIDE MAIN CATEGORIES */}
//           <div className="w-[260px] border-r border-[#f1f1f1] bg-[#fafafa] p-[18px] overflow-y-auto">

//             <div className="space-y-[6px]">

//               {categories.map(
//                 (category, index) => (

//                   <button
//                     key={index}
//                     onMouseEnter={() =>
//                       setActiveCategory(
//                         category
//                       )
//                     }
//                     className={`w-full flex items-center justify-between rounded-[14px] px-[16px] py-[13px] text-left transition-all duration-300 group/tab
                      
//                     ${
//                       activeCategory?.slug ===
//                       category.slug
//                         ? "bg-[#6c7fd8] text-white shadow-lg"
//                         : "text-[#3d4750] hover:bg-[#f3f5ff]"
//                     }`}
//                   >

//                     <span className="text-[14px] font-medium">
//                       {category.name}
//                     </span>

//                     <svg
//                       className={`w-[15px] h-[15px] transition-all duration-300 ${
//                         activeCategory?.slug ===
//                         category.slug
//                           ? "text-white"
//                           : "text-[#999]"
//                       }`}
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth={2}
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M9 5l7 7-7 7"
//                       />
//                     </svg>

//                   </button>
//                 )
//               )}

//             </div>

//           </div>

//           {/* RIGHT SIDE SUBCATEGORIES */}
//           <div className="flex-1 p-[30px]">

//             {activeCategory && (
//               <>

//                 {/* Heading */}
//                 <div className="flex items-center justify-between mb-[25px]">

//                   <div>

//                     <h3 className="text-[24px] font-bold text-[#3d4750]">
//                       {activeCategory.name}
//                     </h3>

//                     <p className="text-[14px] text-[#888] mt-[4px]">
//                       Explore premium collections
//                     </p>

//                   </div>

//                   <Link
//                     href={`/category/${activeCategory.slug}`}
//                     className="px-[18px] py-[10px] rounded-full bg-[#f5f7ff] text-[#6c7fd8] text-[13px] font-semibold hover:bg-[#6c7fd8] hover:text-white transition-all duration-300"
//                   >
//                     View All
//                   </Link>

//                 </div>

//                 {/* Subcategories Grid */}
//                 <div className="grid grid-cols-3 gap-[14px]">

//                   {activeCategory.subcategories.map(
//                     (
//                       subCategory,
//                       subIndex
//                     ) => (

//                       <Link
//                         key={subIndex}
//                         href={`/category/${activeCategory.slug}/${subCategory.slug}`}
//                         className="group/sub flex items-center justify-between rounded-[16px] border border-[#f1f1f1] bg-[#fff] px-[18px] py-[16px] hover:border-[#6c7fd8] hover:bg-[#f8f9ff] transition-all duration-300"
//                       >

//                         <span className="text-[14px] font-medium text-[#555] group-hover/sub:text-[#6c7fd8] transition-all duration-300">

//                           {subCategory.name}

//                         </span>

//                         <svg
//                           className="w-[15px] h-[15px] text-[#bbb] group-hover/sub:text-[#6c7fd8] group-hover/sub:translate-x-[2px] transition-all duration-300"
//                           fill="none"
//                           stroke="currentColor"
//                           strokeWidth={2}
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             d="M9 5l7 7-7 7"
//                           />
//                         </svg>

//                       </Link>
//                     )
//                   )}

//                 </div>

//               </>
//             )}

//           </div>

//         </div>

//       </div>

//     </li>
//   );
// };

// export default HeaderCategoryList;

