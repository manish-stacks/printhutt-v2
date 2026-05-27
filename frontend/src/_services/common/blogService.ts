
import { axiosInstance } from "@/utils/axios";
import { BlogPost } from "@/lib/types/blog";
export const blogFrontService = {
  getAll: (page: string, search: string) => axiosInstance<BlogPost[]>(`/blogs/storefront?page=${page}&search=${search}&limit=9`),
  getBlogDetails:(slug:string) => axiosInstance<BlogPost>(`/blogs/slug/${slug}`),
};


