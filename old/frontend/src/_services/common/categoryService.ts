import { axiosInstance } from "@/utils/axios";;
export const categoryService = {
  getAll: (limit: string | number) => axiosInstance(`/categories/storefront?limit=${limit}`),
  getCategory: (slug: string) => axiosInstance(`/categories/slug/${slug}?type=category`),
  getSubCategory: (slug: string) => axiosInstance(`/categories/slug/${slug}?type=subcategory`),
  getSubcategoryAll: (limit: string | number, category: string) => axiosInstance(`/categories/with-sub?limit=${limit}&category=${category}`),
  getFeaturedCategories: () => axiosInstance(`/categories/featured`),
};


