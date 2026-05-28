import { axiosInstance } from "@/utils/axios";

interface Params {
  queryParams: string;
}

export const productService = {
  getAll: (queryParams: Params) => axiosInstance.get(`/products/storefront?${queryParams}`),
  getTopProducts: (limit: string | number, category: string) => axiosInstance.get(`/products/storefront/related?limit=${limit}&category=${category}`),
  getProductsByCategory: (page: number, category: string, limit = 12) =>
    axiosInstance.get(`/products/storefront/categories?category=${category}&page=${page}&limit=${limit}`),
  getProductsBySubCategory: (page: number, subCategory: string, limit = 12) =>
    axiosInstance.get(`/products/storefront/subcategories?subCategory=${subCategory}&page=${page}&limit=${limit}`),
  getNewArrivals: (limit: string | number, type: string) => axiosInstance.get(`/products/storefront/new?limit=${limit}&type=${type}`),
  getOfferProduct: (limit: string | number) => axiosInstance.get(`/products/storefront/offers?limit=${limit}`),
  getBySlug: (slug: string) => axiosInstance.get(`/products/storefront/${slug}`),
  getById: (id: string) => axiosInstance.get(`/products/storefront/byId/${id}`),
};



