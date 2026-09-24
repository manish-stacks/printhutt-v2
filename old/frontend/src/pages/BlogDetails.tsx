import Breadcrumb from "@/components/Breadcrumb";
import { BlogPost } from "@/lib/types/blog";
import Image from "next/image";
import React from "react";

interface ProductProps {
  blogData: BlogPost | null;
  relatedBlog: BlogPost[];
}

const BlogDetails = ({ blogData, relatedBlog }: ProductProps) => {
  // console.log(blogData)

  const formattedDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }


  return (
    <>
      <Breadcrumb title={"Blog-Details"} />

      <section className="section-blog-details py-[50px] max-[1199px]:py-[35px]">
        <div className="flex flex-wrap justify-between relative items-center mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] min-[576px]:max-w-[540px]">
          <div className="flex flex-wrap mb-[-24px]">
            <div className="min-[1200px]:w-[33.33%] min-[992px]:w-[41.66%] w-full px-[12px] mb-[24px]">
              <div className="bb-blog-sidebar mb-[-24px]">

                {
                  relatedBlog && relatedBlog.length > 0 && (
                    <div
                      className="blog-inner-contact p-[30px] border-[1px] border-solid border-[#eee] mb-[24px] rounded-[20px] max-[575px]:p-[15px]"
                      data-aos="fade-up"
                      data-aos-duration={1000}
                      data-aos-delay={200}
                    >
                      <div className="blog-sidebar-title mb-[20px]">
                        <h4 className="font-quicksand tracking-[0.03rem] leading-[1.2] text-[20px] font-bold text-[#3d4750] max-[575px]:text-[18px]">
                          Recent Articles
                        </h4>
                      </div>
                      {
                        relatedBlog.map((blog, index) => (
                          <div
                            key={index}
                            className="blog-sidebar-card mb-[24px] p-[15px] bg-[#f8f8fb] border border-[#eee] rounded-[20px] flex max-[991px]:flex-row max-[360px]:flex-col"
                          >
                            {/* Image */}
                            <div className="relative mr-[15px] max-[991px]:mr-[20px] max-[360px]:mr-[0] max-[360px]:mb-[15px] w-[90px] h-[90px] shrink-0 overflow-hidden rounded-[10px]">
                              <Image
                                fill
                                src={blog?.image?.url}
                                alt="blog"
                                className="object-cover"
                              />
                            </div>

                            {/* Content */}
                            <div className="blog-sidebar-contact">
                              <span className="font-Poppins text-[13px] font-normal leading-[26px] tracking-[0.02rem] text-[#6c7fd8]">
                                {blog?.category?.name}
                              </span>

                              <h4 className="text-[15px] mb-[8px] leading-[1.2]">
                                <a
                                  href={`/blog-details/${blog?.slug}`}
                                  className="font-Poppins tracking-[0.03rem] text-[15px] font-medium leading-[18px] text-[#3d4750]"
                                >
                                  {blog?.title}
                                </a>
                              </h4>

                              <p className="font-Poppins tracking-[0.03rem] text-[13px] leading-[16px] font-light text-[#686e7d]">
                                {formattedDate(blog?.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )
                }

              </div>
            </div>
            <div className="min-[1200px]:w-[66.66%] min-[992px]:w-[58.33%] w-full px-[12px] mb-[24px]">
              <div
                className="bb-blog-details-contact"
                data-aos="fade-up"
                data-aos-duration={1000}
                data-aos-delay={400}
              >
                <div className="inner-blog-details-image mb-[24px]">
                  <img src={blogData?.image?.url}
                    alt="details-one"
                    className="w-full rounded-[15px]"
                  />
                </div>
                <div className="inner-blog-details-contact mb-[30px]">
                  <span className="font-Poppins mb-[6px] text-[15px] leading-[26px] font-light tracking-[0.02rem] text-[#777]">
                    {formattedDate(blogData?.createdAt)}
                  </span>
                  <h4 className="sub-title font-quicksand tracking-[0.03rem] leading-[1.2] mb-[12px] text-[22px] font-bold text-[#3d4750] max-[575px]:text-[20px]">
                    {blogData?.title}
                  </h4>
                  <div className="mb-[16px] font-Poppins text-[15px] text-[#686e7d] font-light leading-[28px] tracking-[0.03rem]">
                    <div dangerouslySetInnerHTML={{ __html: blogData?.description || "", }} />
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogDetails;
