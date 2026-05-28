"use client"
import ProductCardThree from '@/components/products/ProductCardThree';
import { categoryService } from '@/_services/common/categoryService';
import { productService } from '@/_services/common/productService';
import { useEffect, useState, useRef, useCallback } from 'react';
import SubCategorySection from './SubCategorySection';

interface PropsInterface {
  slug: string;
}

const LIMIT = 12;

const Category = ({ slug }: PropsInterface) => {
  const [categories, setCategoriesData] = useState([]);
  const [products, setProductData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);        // first load
  const [loadingMore, setLoadingMore] = useState(false); // subsequent pages
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerTarget = useRef<HTMLDivElement | null>(null);

  // Fetch subcategories once
  useEffect(() => {
    (async () => {
      try {
        const cats: any = await categoryService.getSubcategoryAll('all', slug);
        setCategoriesData(cats?.categories || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [slug]);

  // Fetch products for a given page
  const fetchProducts = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const res: any = await productService.getProductsByCategory(pageNum, slug, LIMIT);
      const newProducts = res?.products || [];

      setProductData((prev) =>
        pageNum === 1 ? newProducts : [...prev, ...newProducts]
      );
      setHasMore(res?.pagination?.hasMore ?? false);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [slug]);

  // Reset when slug changes
  useEffect(() => {
    setPage(1);
    setProductData([]);
    setHasMore(true);
    fetchProducts(1);
  }, [slug, fetchProducts]);

  // Load more when page increments (page > 1)
  useEffect(() => {
    if (page > 1) fetchProducts(page);
  }, [page, fetchProducts]);

  // IntersectionObserver — jab bottom sentinel dikhe, agla page load karo
  useEffect(() => {
    const el = observerTarget.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '300px' } // 300px pehle hi trigger ho jaaye (smooth)
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore]);

  return (
    <>
      <SubCategorySection slug={slug} categories={categories} loading={loading} />

      <section className="section-shop pb-[50px] max-[1199px]:pb-[35px]">
        <div className="flex flex-wrap justify-between relative items-center mx-auto min-[1400px]:max-w-[1320px] min-[1200px]:max-w-[1140px] min-[992px]:max-w-[960px] min-[768px]:max-w-[720px] min-[576px]:max-w-[540px]">
          <div className="flex flex-wrap w-full px-[12px]">
            <div className="w-full">
              <div className="bb-shop-pro-inner">
                <div className="flex flex-wrap mx-[-12px] mb-[-24px]">

                  {loading ? (
                    Array.from({ length: 8 }, (_, index) => (
                      <div
                        key={index}
                        className="min-[1200px]:w-[25%] min-[768px]:w-[33.33%] w-[50%] max-[480px]:w-full px-[12px] mb-[24px]"
                      >
                        <div className="bb-pro-box bg-[#fff] border border-solid border-[#eee] rounded-[20px]">
                          <div className="bb-pro-img overflow-hidden relative border-b border-solid border-[#eee] z-[4]">
                            <div className="skeleton w-full h-[300px] bg-gray-200 rounded-t-[20px]" />
                          </div>
                          <div className="bb-pro-contact p-[20px]">
                            <div className="bb-pro-subtitle mb-[8px] flex flex-wrap justify-between">
                              <div className="skeleton w-[50%] h-[16px] bg-gray-200" />
                              <div className="skeleton w-[30%] h-[16px] bg-gray-200" />
                            </div>
                            <div className="bb-pro-title mb-[8px]">
                              <div className="skeleton w-[80%] h-[18px] bg-gray-200" />
                            </div>
                            <div className="bb-price flex flex-wrap justify-between">
                              <div className="skeleton w-[40%] h-[18px] bg-gray-200" />
                              <div className="skeleton w-[20%] h-[18px] bg-gray-200" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    products.map((product, index) => (
                      <div
                        key={product?._id || index}
                        className="min-[1200px]:w-[25%] min-[768px]:w-[33.33%] w-[50%] max-[480px]:w-[50%] px-[12px] mb-[24px]"
                      >
                        <ProductCardThree product={product} />
                      </div>
                    ))
                  )}

                </div>

                {/* Load-more skeleton row */}
                {loadingMore && (
                  <div className="flex flex-wrap mx-[-12px] mt-[24px]">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div
                        key={`more-${i}`}
                        className="min-[1200px]:w-[25%] min-[768px]:w-[33.33%] w-[50%] max-[480px]:w-full px-[12px] mb-[24px]"
                      >
                        <div className="bb-pro-box bg-[#fff] border border-solid border-[#eee] rounded-[20px]">
                          <div className="skeleton w-full h-[300px] bg-gray-200 rounded-t-[20px]" />
                          <div className="p-[20px]">
                            <div className="skeleton w-[80%] h-[18px] bg-gray-200 mb-[8px]" />
                            <div className="skeleton w-[40%] h-[18px] bg-gray-200" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sentinel — yeh jab viewport me aayega, agla page load hoga */}
                {hasMore && !loading && (
                  <div ref={observerTarget} className="w-full h-[20px]" />
                )}

                {/* End message */}
                {!hasMore && !loading && products.length > 0 && (
                  <div className="w-full text-center py-[30px] text-[#888] text-[14px]">
                    You've reached the end
                  </div>
                )}

                {/* No products */}
                {!loading && products.length === 0 && (
                  <div className="w-full text-center py-[40px] text-[20px] text-[#666]">
                    No products found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Category;